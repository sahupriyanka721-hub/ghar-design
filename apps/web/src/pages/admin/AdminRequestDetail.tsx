import { BuildGharLoader } from '../../components/common/BuildGharLoader.js';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/common/Badge.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import { safeSetStorage } from '../../lib/safeStorage.js';
import {
  Users,
  Compass,
  Palette,
  HardHat,
  Search,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Clock,
  Layers,
  Check,
  AlertCircle,
  Eye,
  Share2,
  FileText,
  XCircle,
  X,
  FileCheck2,
} from 'lucide-react';
import {
  getPlatformRequestById,
  updatePlatformRequestStatus,
  getPlatformProfessionals,
  PlatformProjectRequest,
  syncChannel,
  broadcastStoreUpdate,
} from '../../data/customerStore.js';
import { pushToCloud } from '../../data/cloudSync.js';
import { getPlatformContractors } from '../../data/adminStore.js';
import { getRegisteredArchitects, getArchitectById, getArchitectByPhone } from '../../data/architectStore.js';
import { getRegisteredInteriorDesigners, saveInteriorQuotation } from '../../data/interiorDesignerStore.js';

export const AdminRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<PlatformProjectRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProIds, setSelectedProIds] = useState<string[]>([]);
  const [proFilter, setProFilter] = useState<'ALL' | 'ARCHITECT' | 'INTERIOR_DESIGNER' | 'CIVIL_ENGINEER'>('ALL');
  const [proSearch, setProSearch] = useState('');
  const [responseDeadline, setResponseDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [internalNotes, setInternalNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [requestQuotations, setRequestQuotations] = useState<any[]>([]);
  const [inspectingQuote, setInspectingQuote] = useState<any | null>(null);
  const { success, error } = useToast();

  const resolveArch = (q: any) => {
    const cleanPhone = (q.professionalPhone || q.phone || q.professional?.phone || '').replace(/\D/g, '').slice(-10);
    const matchedArch = cleanPhone
      ? getArchitectByPhone(cleanPhone)
      : (q.architectId || q.professionalId)
      ? getArchitectById(q.architectId || q.professionalId)
      : null;

    const archId =
      q.architectId ||
      matchedArch?.id ||
      q.professional?.architectId ||
      (typeof q.professionalId === 'string' && q.professionalId.startsWith('ARC') ? q.professionalId : null) ||
      (q.professionalName?.toLowerCase().includes('platform') || q.professional?.name?.toLowerCase().includes('platform')
        ? 'ARC-HQ-ADMIN'
        : (q.professionalId || 'ARC-PENDING'));

    const firmName =
      q.firmName ||
      matchedArch?.firmName ||
      q.professional?.firmName ||
      (q.professionalName?.toLowerCase().includes('platform') || q.professional?.name?.toLowerCase().includes('platform')
        ? 'BuildGhar Platform Engineering'
        : 'Architect Partner Firm');

    const architectName =
      q.architectName ||
      matchedArch?.name ||
      q.professionalName ||
      q.professional?.name ||
      'Architect Partner';

    const archPhone = q.professionalPhone || matchedArch?.phone || q.professional?.phone || '';

    return { archId, firmName, architectName, archPhone };
  };

  const deduplicatePros = (rawList: any[]) => {
    const seenPhone = new Set<string>();
    const seenFirm = new Set<string>();
    const seenId = new Set<string>();
    const result: any[] = [];

    for (const p of rawList) {
      if (!p) continue;
      // Only approved & vetted professionals can be assigned to customer projects
      const isApproved =
        p.accountStatus === 'APPROVED' ||
        p.isVerified === true ||
        p.verificationStatus === 'APPROVED';

      if (!isApproved) continue;

      const cleanPhone = (p.phone || '').replace(/\D/g, '').slice(-10);
      const cleanFirm = (p.firmName || p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanId = (p.id || p.userId || '').toLowerCase().trim();

      if (cleanPhone && seenPhone.has(cleanPhone)) continue;
      if (cleanFirm && seenFirm.has(cleanFirm)) continue;
      if (cleanId && seenId.has(cleanId)) continue;

      if (cleanPhone) seenPhone.add(cleanPhone);
      if (cleanFirm) seenFirm.add(cleanFirm);
      if (cleanId) seenId.add(cleanId);

      result.push(p);
    }
    return result;
  };

  const loadQuotes = (currentReq?: PlatformProjectRequest | null) => {
    const targetId = id || currentReq?.id;
    const targetCode = currentReq?.requestCode;
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const matched = parsed.filter(
            (q: any) =>
              (targetId && q.requestId === targetId) ||
              (targetCode && (q.requestCode === targetCode || q.requestId === targetCode))
          );
          setRequestQuotations(matched);
        }
      }
    } catch (e) {}
  };

  const loadData = () => {
    if (!id) return;
    const local = getPlatformRequestById(id);
    if (local) {
      setRequest(local);
      loadQuotes(local);
      if (local.assignedProfessionalIds && local.assignedProfessionalIds.length > 0) {
        setSelectedProIds(local.assignedProfessionalIds);
      }
      if (local.responseDeadline) {
        setResponseDeadline(local.responseDeadline);
      }
      if (local.adminNotes) {
        setInternalNotes(local.adminNotes);
      }
      setLoading(false);
      return;
    }

    apiRequest(`/requests/${id}`)
      .then((res) => {
        if (res.data) {
          setRequest(res.data);
          loadQuotes(res.data);
        }
      })
      .catch(() => {
        setRequest(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();

    const fallbackPros = deduplicatePros([
      ...getRegisteredArchitects()
        .filter((a) => a.accountStatus === 'APPROVED' || a.isVerified)
        .map((a) => ({
          id: a.id,
          userId: a.id,
          name: a.name,
          firmName: a.firmName || a.name,
          category: 'ARCHITECT',
          phone: a.phone,
          rating: 4.9,
          experienceYears: a.experienceYears || 10,
          city: a.city || 'Delhi NCR',
          accountStatus: a.accountStatus,
          isVerified: a.isVerified,
        })),
      ...getRegisteredInteriorDesigners()
        .filter((d) => d.isVerified || d.verificationStatus === 'APPROVED')
        .map((d) => ({
          id: d.id,
          userId: d.id,
          name: d.name,
          firmName: d.businessName || d.name,
          category: 'INTERIOR_DESIGNER',
          phone: d.phone,
          rating: 4.9,
          experienceYears: d.yearsOfExperience || 8,
          city: d.city || 'Delhi NCR',
          accountStatus: 'APPROVED',
          isVerified: true,
        })),
      ...getPlatformContractors().map((c) => ({
        id: c.id,
        userId: c.id,
        name: c.name,
        firmName: c.firmName,
        category: 'CIVIL_ENGINEER',
        phone: c.phone,
        rating: c.rating || 4.8,
        experienceYears: c.experienceYears || 12,
        city: c.city || 'Gurugram',
        accountStatus: 'APPROVED',
        isVerified: true,
      })),
      ...getPlatformProfessionals(),
    ]);

    apiRequest('/admin/professionals')
      .then((res) => {
        const fetched = res.data || [];
        const merged = fetched.length > 0 ? [...fetched, ...fallbackPros] : fallbackPros;
        setProfessionals(deduplicatePros(merged));
      })
      .catch(() => {
        setProfessionals(fallbackPros);
      });

    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'PROJECT_REQUESTS_UPDATED' || event.data?.type === 'QUOTATIONS_UPDATED') {
        loadData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    window.addEventListener('storage', loadData);

    return () => {
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
      window.removeEventListener('storage', loadData);
    };
  }, [id]);

  const filteredPros = useMemo(() => {
    return professionals.filter((pro) => {
      const cat = (pro.category || '').toUpperCase();
      const matchCat =
        proFilter === 'ALL' ||
        (proFilter === 'ARCHITECT' && (cat.includes('ARCHITECT') || cat.includes('STRUCTURAL'))) ||
        (proFilter === 'INTERIOR_DESIGNER' && (cat.includes('INTERIOR') || cat.includes('DESIGNER'))) ||
        (proFilter === 'CIVIL_ENGINEER' && (cat.includes('CIVIL') || cat.includes('CONTRACTOR')));

      const q = proSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (pro.name && pro.name.toLowerCase().includes(q)) ||
        (pro.firmName && pro.firmName.toLowerCase().includes(q)) ||
        (pro.city && pro.city.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [professionals, proFilter, proSearch]);

  const togglePro = (userId: string) => {
    setSelectedProIds((prev) =>
      prev.includes(userId) ? prev.filter((p) => p !== userId) : [...prev, userId]
    );
  };

  const handleUpdateStatus = (newStatus: PlatformProjectRequest['status']) => {
    if (!request) return;
    const updated = updatePlatformRequestStatus(request.id, newStatus, {
      adminNotes: internalNotes,
    });
    if (updated) {
      setRequest(updated);
      success(`Project request status successfully changed to "${newStatus.replace(/_/g, ' ')}"`);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    if (selectedProIds.length === 0) {
      error('Please select at least one certified professional firm.');
      return;
    }
    setIsAssigning(true);

    try {
      const allAssignedTokens = new Set<string>();
      selectedProIds.forEach((proId) => {
        allAssignedTokens.add(proId);
        allAssignedTokens.add(proId.replace(/\s+/g, ''));
        const matched = professionals.find((p) => p.id === proId || p.userId === proId);
        if (matched) {
          if (matched.id) {
            allAssignedTokens.add(matched.id);
            allAssignedTokens.add(matched.id.replace(/\s+/g, ''));
          }
          if (matched.userId) allAssignedTokens.add(matched.userId);
          if (matched.phone) {
            const ph = matched.phone.replace(/\D/g, '').slice(-10);
            if (ph) {
              allAssignedTokens.add(ph);
              allAssignedTokens.add(`+91 ${ph}`);
              allAssignedTokens.add(`usr-arch-${ph}`);
              allAssignedTokens.add(`pro-${ph}`);
            }
          }
        }
      });
      const expandedAssignedIds = Array.from(allAssignedTokens);

      await apiRequest(`/admin/requests/${request.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          professionalIds: expandedAssignedIds,
          responseDeadline,
          internalNotes,
        }),
      }).catch(() => {});

      const updated = updatePlatformRequestStatus(request.id, 'ASSIGNED', {
        assignedCount: selectedProIds.length,
        assignedProfessionalIds: expandedAssignedIds,
        responseDeadline,
        adminNotes: internalNotes,
      });

      broadcastStoreUpdate('PROJECT_REQUESTS_UPDATED', [updated]);
      pushToCloud().catch(() => {});

      if (updated) {
        setRequest(updated);
      }
      success(`Assigned ${selectedProIds.length} certified professionals. They will be notified to review the scope and submit itemized BOQ quotations.`);
    } catch (err: any) {
      error(err.message || 'Assignment failed');
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePublishQuote = (quoteId: string) => {
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((q: any) =>
          q.id === quoteId || q.quotationCode === quoteId
            ? { ...q, status: 'PUBLISHED_TO_CUSTOMER', publishedAt: new Date().toISOString() }
            : q
        );
        safeSetStorage('platform_quotations', updated);
        broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
        pushToCloud().catch(() => {});
        setRequestQuotations((prev) =>
          prev.map((q) =>
            q.id === quoteId || q.quotationCode === quoteId
              ? { ...q, status: 'PUBLISHED_TO_CUSTOMER', publishedAt: new Date().toISOString() }
              : q
          )
        );
      }
      if (request) {
        updatePlatformRequestStatus(request.id, 'QUOTATIONS_AVAILABLE', {
          quotationsCount: Math.max((request.quotationsCount || 0), 1),
        });
      }
      success('Quotation published to homeowner successfully.');
    } catch (e: any) {
      error(e.message || 'Failed to publish quotation');
    }
  };

  const handlePublishAllQuotes = () => {
    if (requestQuotations.length === 0) return;
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        const reqQuoteIds = new Set(requestQuotations.map((q) => q.id || q.quotationCode));
        const updated = parsed.map((q: any) =>
          reqQuoteIds.has(q.id) || reqQuoteIds.has(q.quotationCode)
            ? { ...q, status: 'PUBLISHED_TO_CUSTOMER', publishedAt: new Date().toISOString() }
            : q
        );
        safeSetStorage('platform_quotations', updated);
        broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
        pushToCloud().catch(() => {});
        setRequestQuotations((prev) =>
          prev.map((q) => ({ ...q, status: 'PUBLISHED_TO_CUSTOMER', publishedAt: new Date().toISOString() }))
        );
      }
      if (request) {
        updatePlatformRequestStatus(request.id, 'QUOTATIONS_AVAILABLE', {
          quotationsCount: requestQuotations.length,
        });
      }
      success(`All ${requestQuotations.length} quotations published to homeowner successfully.`);
    } catch (e: any) {
      error(e.message || 'Failed to publish quotations');
    }
  };

  const handleApproveQuote = (quoteId: string) => {
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((q: any) =>
          q.id === quoteId || q.quotationCode === quoteId
            ? { ...q, status: 'APPROVED', approvedAt: new Date().toISOString() }
            : q
        );
        safeSetStorage('platform_quotations', updated);
        broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
        setRequestQuotations((prev) =>
          prev.map((q) =>
            q.id === quoteId || q.quotationCode === quoteId
              ? { ...q, status: 'APPROVED', approvedAt: new Date().toISOString() }
              : q
          )
        );
      }
      success('Quotation marked as Approved.');
    } catch (e: any) {
      error(e.message || 'Failed to approve quotation');
    }
  };

  const handleRejectQuote = (quoteId: string) => {
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((q: any) =>
          q.id === quoteId || q.quotationCode === quoteId
            ? { ...q, status: 'REJECTED', rejectedAt: new Date().toISOString() }
            : q
        );
        safeSetStorage('platform_quotations', updated);
        broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
        setRequestQuotations((prev) =>
          prev.map((q) =>
            q.id === quoteId || q.quotationCode === quoteId
              ? { ...q, status: 'REJECTED', rejectedAt: new Date().toISOString() }
              : q
          )
        );
      }
      success('Quotation marked as Rejected.');
    } catch (e: any) {
      error(e.message || 'Failed to reject quotation');
    }
  };

  if (loading) {
    return <div className="p-16 flex items-center justify-center"><BuildGharLoader message="Loading project specifications..." /></div>;
  }

  if (!request) {
    return (
      <div className="card p-12 text-center space-y-4 max-w-xl mx-auto my-8 bg-white border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold font-display text-navy-950">Project Request Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested project inquiry does not exist or has been removed from the platform.
        </p>
        <Link to="/admin/requests" className="btn-primary text-xs py-2 px-5 inline-block">
          Return to All Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/admin/requests" className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1">
            ← Back to All Requests
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-navy-950">{request.requestCode}</h1>
            <Badge status={request.status} />
          </div>
          <p className="text-xs text-slate-500">
            Inquiry Category: <strong className="capitalize text-slate-700">{request.categorySlug?.replace(/-/g, ' ')}</strong>
          </p>
        </div>

        {/* Quick Admin Verification Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          {request.status !== 'VERIFIED' && (
            <button
              onClick={() => handleUpdateStatus('VERIFIED')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Request</span>
            </button>
          )}

          {request.status !== 'APPROVED' && (
            <button
              onClick={() => handleUpdateStatus('APPROVED')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approve Scope</span>
            </button>
          )}

          <div className="relative">
            <select
              value={request.status}
              onChange={(e) => handleUpdateStatus(e.target.value as any)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="UNDER_REVIEW">Status: Under Review</option>
              <option value="VERIFIED">Status: Verified</option>
              <option value="APPROVED">Status: Approved</option>
              <option value="ASSIGNED">Status: Assigned</option>
              <option value="QUOTATIONS_AVAILABLE">Status: Quotations Available</option>
              <option value="BOOKING_CONFIRMED">Status: Booking Confirmed</option>
              <option value="IN_PROGRESS">Status: In Progress</option>
              <option value="COMPLETED">Status: Completed</option>
              <option value="CANCELLED">Status: Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer & Location Card */}
      <div className="card p-6 bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Customer Profile & Site Details</span>
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {request.isFeePaid ? 'Quotation Fee Paid (₹499)' : 'Fee Verification Pending'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Homeowner Name:</span>
            <span className="font-bold text-slate-900 text-sm">{request.customerName}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Contact Phone:</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{request.customerPhone}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Site Location:</span>
            <span className="font-semibold text-slate-800">{request.locality}, {request.city}, {request.state}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Client Budget Range:</span>
            <span className="font-bold text-amber-700">{request.budgetRange || 'Not Specified'}</span>
          </div>
        </div>

        {request.address && (
          <div className="text-xs text-slate-600 flex items-center gap-2 pt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span><strong>Full Site Address:</strong> {request.address}</span>
          </div>
        )}
      </div>

      {/* Property & Engineering Specs */}
      <div className="card p-6 bg-white border border-slate-200 space-y-4">
        <h2 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Property Dimensions & Engineering Scope</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Plot Dimensions:</span>
            <span className="font-bold text-slate-900">
              {request.plotWidth && request.plotLength
                ? `${request.plotWidth} × ${request.plotLength} ${request.measurementUnit?.toLowerCase() || 'ft'}`
                : request.plotArea
                ? `${request.plotArea} ${request.measurementUnit?.toLowerCase() || 'sq.ft'}`
                : 'Not Specified'}
            </span>
            {request.plotArea && (
              <span className="text-[10px] text-blue-700 block mt-0.5 font-semibold">
                ({request.plotArea} {request.measurementUnit === 'METRES' ? 'sq.m' : 'sq.ft'})
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Floors / Height:</span>
            <span className="font-bold text-slate-900">
              {request.floors !== undefined && request.floors !== null
                ? `${request.floors} Floor${request.floors > 1 ? 's' : ''} ${request.floors > 1 ? `(G+${request.floors - 1})` : '(Ground)'}`
                : 'Not Specified'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Rooms Breakdown:</span>
            <span className="font-semibold text-slate-900">
              {request.bedrooms !== undefined || request.bathrooms !== undefined || request.kitchens !== undefined
                ? `${request.bedrooms ?? 0} Beds • ${request.bathrooms ?? 0} Baths • ${request.kitchens ?? 0} Kitchens`
                : 'Not Specified'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Engineering Style:</span>
            <span className="font-semibold text-slate-900">{request.designStyle || 'Standard Residential'}</span>
          </div>
        </div>

        {/* Additional Real Project Specifications */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Property Type:</span>
            <span className="font-bold text-slate-900">{request.propertyType || 'Residential Plot'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Built-Up Area:</span>
            <span className="font-bold text-slate-900">
              {request.builtUpArea ? `${request.builtUpArea} sq.ft` : 'As per FSI & Guidelines'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Current Site State:</span>
            <span className="font-bold text-slate-900">{request.currentCondition || 'Vacant / Ready for Planning'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Preferred Start Date:</span>
            <span className="font-bold text-slate-900">{request.preferredStartDate || 'Immediate'}</span>
          </div>
        </div>

        {request.siteAccessibilityNotes && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs">
            <span className="text-slate-400 block mb-0.5">Site Access & Approach Road:</span>
            <span className="font-medium text-slate-800">{request.siteAccessibilityNotes}</span>
          </div>
        )}

        {request.requiredServices && request.requiredServices.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700 block mb-2">Required Drawings & Engineering Deliverables:</span>
            <div className="flex flex-wrap gap-2">
              {(request.requiredServices || []).map((srv, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-medium">
                  ✓ {srv}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <span className="text-xs font-bold text-slate-700 block mb-1">Customer Project Vision:</span>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            {request.description}
          </p>
        </div>
      </div>

      {/* Assignment & Quotation Dispatch Form */}
      <form onSubmit={handleAssignSubmit} className="card p-6 bg-white border border-slate-200 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold font-display text-navy-950">
              Assign Certified Regional Professionals
            </h2>
            <p className="text-xs text-slate-500">
              Select accredited professionalure & engineering firms to prepare competitive itemized BOQs for this homeowner.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {selectedProIds.length} Firms Selected
          </span>
        </div>

        {/* Discipline Filter Tabs & Live Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Professionals', count: professionals.length },
              { id: 'ARCHITECT', label: 'Architects', icon: Compass, count: professionals.filter(p => (p.category||'').toUpperCase().includes('ARCHITECT') || (p.category||'').toUpperCase().includes('STRUCTURAL')).length },
              { id: 'INTERIOR_DESIGNER', label: 'Interior Designers', icon: Palette, count: professionals.filter(p => (p.category||'').toUpperCase().includes('INTERIOR') || (p.category||'').toUpperCase().includes('DESIGNER')).length },
              { id: 'CIVIL_ENGINEER', label: 'Contractors', icon: HardHat, count: professionals.filter(p => (p.category||'').toUpperCase().includes('CIVIL') || (p.category||'').toUpperCase().includes('CONTRACTOR')).length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = proFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-navy-950 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search firm or city..."
                value={proSearch}
                onChange={(e) => setProSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
            </div>
            {selectedProIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedProIds([])}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold border border-rose-200 cursor-pointer"
              >
                Clear ({selectedProIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPros.map((pro) => {
            const pId = pro.userId || pro.id;
            const isSelected = selectedProIds.includes(pId);

            return (
              <label
                key={pId}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePro(pId)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-navy-950 text-xs">{pro.firmName || pro.name}</div>
                    <div className="text-[11px] text-slate-500">{pro.name} • {pro.category?.replace(/_/g, ' ')} • {pro.city}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Certified Verified ★ {pro.rating || '4.8'}
                </span>
              </label>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Response Deadline for Bids</label>
            <input
              type="date"
              required
              className="input-field text-xs"
              value={responseDeadline}
              onChange={(e) => setResponseDeadline(e.target.value)}
            />
          </div>

          <div>
            <label className="label-text">Internal Technical Review Notes</label>
            <input
              type="text"
              className="input-field text-xs"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Homeowner will receive notification once assignments are dispatched.
          </div>
          <button
            type="submit"
            disabled={isAssigning}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-navy-950 hover:from-blue-800 hover:to-navy-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <span>{isAssigning ? 'Dispatching...' : 'Dispatch Assignments & Publish'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Submitted Quotations Section (Multi-Architect Comparison Table) */}
      <div className="card p-6 bg-white border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-display text-navy-950">
                Architect Submitted Quotations ({requestQuotations.length})
              </h2>
              {requestQuotations.length > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ready for Admin Verification
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Itemized BOQ quotations submitted by accredited architects who accepted this inquiry. Review financial breakdown and publish vetted bids to client.
            </p>
          </div>

          {requestQuotations.length > 0 && (
            <button
              type="button"
              onClick={handlePublishAllQuotes}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Publish All Approved to Customer</span>
            </button>
          )}
        </div>

        {requestQuotations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-semibold text-slate-600">No BOQ Quotations Submitted Yet</div>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Assigned architects will review the client requirements and submit itemized quotations. Submitted bids will appear here for side-by-side comparison in table format [a, b, c...].
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Slot</th>
                  <th className="py-3 px-3">Architect Firm Name</th>
                  <th className="py-3 px-3">Architect ID</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">Discount to Client</th>
                  <th className="py-3 px-3 text-right">Net Total</th>
                  <th className="py-3 px-3 text-right">GST (18%)</th>
                  <th className="py-3 px-3 text-right font-black">Final Quotation Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requestQuotations.map((q, idx) => {
                  const letter = String.fromCharCode(97 + idx); // a, b, c, d...
                  const { archId, firmName, architectName, archPhone } = resolveArch(q);
                  const subtotal = q.subtotalPaise ? q.subtotalPaise / 100 : (q.totalAmountPaise ? q.totalAmountPaise / 100 : 0);
                  const discount = q.discountPaise ? q.discountPaise / 100 : 0;
                  const net = Math.max(0, subtotal - discount);
                  const tax = q.taxPaise ? q.taxPaise / 100 : Math.round(net * 0.18);
                  const finalTotal = q.finalAmountPaise ? q.finalAmountPaise / 100 : (net + tax);

                  return (
                    <tr key={q.id || q.quotationCode || idx} className="hover:bg-sky-50/40 transition">
                      <td className="py-3.5 px-3 font-mono font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px]">
                          Architect [{letter}]
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{firmName}</span>
                        <span className="text-[11px] text-slate-500">{architectName} • {archPhone}</span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                          {archId}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                        ₹{subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                        {discount > 0 ? `-₹${discount.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-900 font-semibold">
                        ₹{net.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        ₹{tax.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-black text-navy-950 text-sm whitespace-nowrap">
                        ₹{finalTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <Badge status={q.status} />
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingQuote(q)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-navy-950 hover:bg-navy-900 text-white flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            title="Inspect full BOQ schedule"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-300" />
                            <span>Inspect</span>
                          </button>

                          {q.status !== 'APPROVED' && q.status !== 'PUBLISHED_TO_CUSTOMER' && q.status !== 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => handleApproveQuote(q.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                              title="Approve quotation"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {q.status !== 'PUBLISHED_TO_CUSTOMER' && q.status !== 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => handlePublishQuote(q.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1 transition shadow-2xs cursor-pointer"
                              title="Publish quotation to homeowner"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </button>
                          )}

                          {q.status !== 'REJECTED' && q.status !== 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => handleRejectQuote(q.id)}
                              className="p-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                              title="Reject quotation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect BOQ Modal */}
      {inspectingQuote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 text-left shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold font-display text-navy-950 text-base flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-sky-600" />
                  <span>Itemized BOQ Schedule — {inspectingQuote.quotationCode || inspectingQuote.id}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted by {resolveArch(inspectingQuote).firmName} ({resolveArch(inspectingQuote).archId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingQuote(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Summary */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Scope of Work:</span>
              <p className="text-slate-600 leading-relaxed">
                {inspectingQuote.scopeOfWork || inspectingQuote.description || 'Turnkey architectural planning and structural design scope.'}
              </p>
            </div>

            {/* Line items table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Itemized Line Items Schedule:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Unit Rate (₹)</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(inspectingQuote.items || inspectingQuote.lineItems || []).map((it: any, i: number) => {
                      const qty = it.quantity || 1;
                      const rate = it.rate || (it.unitPricePaise ? it.unitPricePaise / 100 : 0);
                      const total = it.total || (it.totalPaise ? it.totalPaise / 100 : qty * rate);
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-800">{it.description}</td>
                          <td className="p-2.5 text-right text-slate-600">{qty} {it.unit || 'sq.ft'}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">₹{rate.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{total.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-navy-950 text-white rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-mono">
                  ₹{(inspectingQuote.subtotalPaise ? inspectingQuote.subtotalPaise / 100 : (inspectingQuote.totalAmountPaise ? inspectingQuote.totalAmountPaise / 100 : 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Discount to Client:</span>
                <span className="font-mono">
                  -₹{(inspectingQuote.discountPaise ? inspectingQuote.discountPaise / 100 : 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Net Taxable Total:</span>
                <span className="font-mono font-semibold">
                  ₹{Math.max(0, (inspectingQuote.subtotalPaise ? inspectingQuote.subtotalPaise / 100 : (inspectingQuote.totalAmountPaise ? inspectingQuote.totalAmountPaise / 100 : 0)) - (inspectingQuote.discountPaise ? inspectingQuote.discountPaise / 100 : 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GST (18%):</span>
                <span className="font-mono">
                  ₹{(inspectingQuote.taxPaise ? inspectingQuote.taxPaise / 100 : Math.round(Math.max(0, (inspectingQuote.subtotalPaise ? inspectingQuote.subtotalPaise / 100 : (inspectingQuote.totalAmountPaise ? inspectingQuote.totalAmountPaise / 100 : 0)) - (inspectingQuote.discountPaise ? inspectingQuote.discountPaise / 100 : 0)) * 0.18)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold text-sm pt-2 border-t border-white/10">
                <span>Final Quotation Total:</span>
                <span className="font-mono">
                  ₹{(inspectingQuote.finalAmountPaise ? inspectingQuote.finalAmountPaise / 100 : 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInspectingQuote(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Close
              </button>
              {inspectingQuote.status !== 'PUBLISHED_TO_CUSTOMER' && inspectingQuote.status !== 'ACCEPTED' && (
                <button
                  type="button"
                  onClick={() => {
                    handlePublishQuote(inspectingQuote.id);
                    setInspectingQuote(null);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Publish to Customer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
