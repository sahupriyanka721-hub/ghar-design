import { BuildGharLoader } from '../../components/common/BuildGharLoader.js';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/common/Badge.js';
import { useToast } from '../../context/ToastContext.js';
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
import { getRegisteredArchitects } from '../../data/architectStore.js';
import { getRegisteredInteriorDesigners, saveInteriorQuotation } from '../../data/interiorDesignerStore.js';

export const AdminRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<PlatformProjectRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProIds, setSelectedProIds] = useState<string[]>([]);
  const [proFilter, setProFilter] = useState<'ALL' | 'ARCHITECT' | 'INTERIOR_DESIGNER' | 'CIVIL_ENGINEER'>('ALL');
  const [proSearch, setProSearch] = useState('');
  const [responseDeadline, setResponseDeadline] = useState('2026-11-15');
  const [internalNotes, setInternalNotes] = useState('Scope verified by in-house structural engineer. Ready for competitive BOQ bidding.');
  const [isAssigning, setIsAssigning] = useState(false);
  const { success, error } = useToast();

  const loadData = () => {
    if (!id) return;
    const local = getPlatformRequestById(id);
    if (local) {
      setRequest(local);
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
        if (res.data) setRequest(res.data);
      })
      .catch(() => {
        setRequest(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();

    const fallbackPros = [
      ...getRegisteredArchitects().map((a) => ({
        id: a.id,
        userId: a.id,
        name: a.name,
        firmName: a.firmName || a.name,
        category: 'ARCHITECT',
        phone: a.phone,
        rating: 4.9,
        experienceYears: a.experienceYears || 10,
        city: a.city || 'Delhi NCR',
      })),
      ...getRegisteredInteriorDesigners().map((d) => ({
        id: d.id,
        userId: d.id,
        name: d.name,
        firmName: d.businessName || d.name,
        category: 'INTERIOR_DESIGNER',
        phone: d.phone,
        rating: 4.9,
        experienceYears: d.yearsOfExperience || 8,
        city: d.city || 'Delhi NCR',
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
      })),
      ...getPlatformProfessionals(),
    ];

    apiRequest('/admin/professionals')
      .then((res) => {
        const fetched = res.data || [];
        const merged = fetched.length > 0 ? [...fetched, ...fallbackPros] : fallbackPros;
        setProfessionals(merged);
        // No automatic assignment: admin selects explicitly
      })
      .catch(() => {
        setProfessionals(fallbackPros);
        // No automatic assignment: admin selects explicitly
      });

    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'PROJECT_REQUESTS_UPDATED') {
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
            <span className="font-bold text-amber-700">{request.budgetRange || '₹50 Lakhs - ₹1 Crore'}</span>
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
              {request.plotWidth || 30} × {request.plotLength || 60} {request.measurementUnit?.toLowerCase() || 'ft'}
            </span>
            <span className="text-[10px] text-blue-700 block mt-0.5 font-semibold">
              ({request.plotArea || 1800} {request.measurementUnit === 'METRES' ? 'sq.m' : 'sq.ft'})
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Floors / Height:</span>
            <span className="font-bold text-slate-900">{request.floors || 3} Floors (G+{Math.max(1, (request.floors || 3) - 1)})</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Rooms Breakdown:</span>
            <span className="font-semibold text-slate-900">
              {request.bedrooms || 4} Beds • {request.bathrooms || 4} Baths • {request.kitchens || 2} Kitchens
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Engineering Style:</span>
            <span className="font-semibold text-slate-900">{request.designStyle || 'Modern & Minimalist'}</span>
          </div>
        </div>

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
            className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-navy-950 hover:from-blue-800 hover:to-navy-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <span>{isAssigning ? 'Dispatching...' : 'Dispatch Assignments & Publish'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
