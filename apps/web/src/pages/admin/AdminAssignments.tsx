import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDate, formatINR } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getPlatformRequests,
  updatePlatformRequestStatus,
  PlatformProjectRequest,
  syncChannel,
  broadcastStoreUpdate,
} from '../../data/customerStore.js';
import {
  getArchitectAccounts,
  ArchitectAccount,
} from '../../data/architectStore.js';
import { logAdminAuditAction, getActiveAdminRole } from '../../data/adminRbacStore.js';
import { pushToCloud, pullFromCloud } from '../../data/cloudSync.js';
import {
  Layers,
  Compass,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  Check,
  RotateCcw,
  Plus,
  Send,
  AlertTriangle,
  Award,
} from 'lucide-react';

export const AdminAssignments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialReqId = searchParams.get('requestId');

  const { success, error } = useToast();
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [architects, setArchitects] = useState<ArchitectAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Assign Modal State
  const [selectedRequest, setSelectedRequest] = useState<PlatformProjectRequest | null>(null);
  const [selectedArchitectIds, setSelectedArchitectIds] = useState<string[]>([]);
  const [responseDeadline, setResponseDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [assignmentNotes, setAssignmentNotes] = useState('Please review homeowner plot measurements and submit itemized BOQ quotation.');
  const [architectSearch, setArchitectSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');

  const activeAdminRole = getActiveAdminRole();

  const loadData = () => {
    const allReqs = getPlatformRequests();
    setRequests(allReqs);
    const allArchs = getArchitectAccounts();
    // Only approved & active architects are eligible for assignment
    setArchitects(allArchs.filter((a) => a.accountStatus === 'APPROVED' || a.isVerified === true));
  };

  useEffect(() => {
    loadData();

    if (initialReqId) {
      const allReqs = getPlatformRequests();
      const target = allReqs.find((r) => r.id === initialReqId || r.requestCode === initialReqId);
      if (target) {
        openAssignModal(target);
      }
    }

    const onSync = (e: MessageEvent) => {
      if (e.data?.type === 'PROJECT_REQUESTS_UPDATED') {
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
  }, [initialReqId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await pullFromCloud();
      loadData();
      success('Assignment queues and architect network refreshed.');
    } catch {
      loadData();
      success('Refreshed.');
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Open multi-architect assignment modal
  const openAssignModal = (req: PlatformProjectRequest) => {
    setSelectedRequest(req);
    const existing = req.selectedProfessionalIds || req.assignedProfessionalIds || [];
    setSelectedArchitectIds(existing);
    setResponseDeadline(req.responseDeadline || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })());
    setAssignmentNotes(req.adminNotes || 'Please review homeowner plot measurements and submit itemized BOQ quotation.');
  };

  const toggleArchitect = (archId: string) => {
    setSelectedArchitectIds((prev) =>
      prev.includes(archId) ? prev.filter((id) => id !== archId) : [...prev, archId]
    );
  };

  // Dispatch Assignment Submission
  const handleConfirmAssignment = async () => {
    if (!selectedRequest) return;
    if (selectedArchitectIds.length === 0) {
      error('Please select at least one approved architect partner to receive this quotation assignment.');
      return;
    }

    const selectedArchObjs = selectedArchitectIds.map((archId) => {
      const found = architects.find((a) => a.id === archId);
      return {
        id: archId,
        name: found?.name || 'Architect Partner',
        firmName: found?.firmName || found?.name || 'Architect Studio',
        phone: found?.phone || '',
        category: 'ARCHITECT',
      };
    });

    const updated = updatePlatformRequestStatus(selectedRequest.id, 'ASSIGNED', {
      assignedCount: selectedArchitectIds.length,
      selectedProfessionalIds: selectedArchitectIds,
      assignedProfessionalIds: selectedArchitectIds,
      assignedProfessionals: selectedArchObjs,
      responseDeadline,
      adminNotes: assignmentNotes,
    });

    if (updated) {
      broadcastStoreUpdate('PROJECT_REQUESTS_UPDATED', [updated]);
      logAdminAuditAction({
        action: 'ASSIGN_ARCHITECTS_TO_REQUEST',
        module: 'ARCHITECT_ASSIGNMENT_MANAGEMENT',
        targetId: selectedRequest.id,
        targetName: selectedRequest.requestCode || selectedRequest.id,
        details: {
          assignedCount: selectedArchitectIds.length,
          architectIds: selectedArchitectIds,
          responseDeadline,
          notes: assignmentNotes,
        },
      });
      await pushToCloud().catch(() => {});
      loadData();
      setSelectedRequest(null);
      success(
        `Quotation request successfully assigned to ${selectedArchitectIds.length} approved architect ${
          selectedArchitectIds.length === 1 ? 'partner' : 'partners'
        }!`
      );
    }
  };

  // KPIs
  const metrics = useMemo(() => {
    const total = requests.length;
    const unassigned = requests.filter(
      (r) =>
        (!r.assignedProfessionalIds || r.assignedProfessionalIds.length === 0) &&
        r.status !== 'CANCELLED' &&
        r.status !== 'COMPLETED'
    ).length;
    const assigned = requests.filter(
      (r) => r.assignedProfessionalIds && r.assignedProfessionalIds.length > 0
    ).length;
    const availableArchitects = architects.length;

    return { total, unassigned, assigned, availableArchitects };
  }, [requests, architects]);

  // Filtered Requests Table
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const hasAssignment = r.assignedProfessionalIds && r.assignedProfessionalIds.length > 0;
      if (filterMode === 'UNASSIGNED' && hasAssignment) return false;
      if (filterMode === 'ASSIGNED' && !hasAssignment) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const code = (r.requestCode || r.id).toLowerCase();
      const name = (r.customerName || '').toLowerCase();
      const phone = (r.customerPhone || '').toLowerCase();
      const city = (r.city || '').toLowerCase();
      const service = (r.categorySlug || '').toLowerCase();
      return (
        code.includes(term) ||
        name.includes(term) ||
        phone.includes(term) ||
        city.includes(term) ||
        service.includes(term)
      );
    });
  }, [requests, filterMode, searchTerm]);

  // Filtered Architects for Modal Selection
  const filteredArchitects = useMemo(() => {
    return architects.filter((a) => {
      if (cityFilter !== 'ALL' && a.city?.toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }
      if (!architectSearch.trim()) return true;
      const term = architectSearch.toLowerCase();
      return (
        a.name.toLowerCase().includes(term) ||
        (a.firmName && a.firmName.toLowerCase().includes(term)) ||
        (a.coaNumber && a.coaNumber.toLowerCase().includes(term)) ||
        (a.city && a.city.toLowerCase().includes(term)) ||
        a.id.toLowerCase().includes(term)
      );
    });
  }, [architects, cityFilter, architectSearch]);

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    architects.forEach((a) => {
      if (a.city) set.add(a.city);
    });
    return Array.from(set);
  }, [architects]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-[#0e2a4f] to-[#163b6b] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-400/15 border border-indigo-400/30 rounded-full text-indigo-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Architect Assignment Management Desk (Module 5)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Centralized Architect Allocation & Dispatch
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Enforce strict routing: Homeowner quotation requests are reviewed by Admin and assigned to certified,
              COA-verified architectural partner firms with response SLA tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-xs"
              title="Refresh Assignment Queues"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Assignment KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
            Pending Assignment
          </span>
          <div className="text-3xl font-black font-display text-amber-900">{metrics.unassigned}</div>
          <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Ready for architect allocation</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
            Assigned & In Quotation
          </span>
          <div className="text-3xl font-black font-display text-navy-950">{metrics.assigned}</div>
          <span className="text-[11px] text-blue-700 font-semibold">Under partner preparation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
            Approved Active Architects
          </span>
          <div className="text-3xl font-black font-display text-purple-950">
            {metrics.availableArchitects}
          </div>
          <span className="text-[11px] text-purple-700 font-semibold">Eligible for new client RFQs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Total Requests Tracked
          </span>
          <div className="text-3xl font-black font-display text-emerald-950">{metrics.total}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">Central RFQ pipeline</span>
        </div>
      </div>

      {/* Main Table Controls & Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy-950">Homeowner RFQ Assignment Queue</h3>
              <p className="text-xs text-slate-500">
                Match verified landowner inquiries with approved architects in the corresponding city
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  filterMode === 'ALL' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({requests.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('UNASSIGNED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  filterMode === 'UNASSIGNED'
                    ? 'bg-amber-400 text-navy-950 shadow-xs'
                    : 'text-amber-800'
                }`}
              >
                Unassigned ({metrics.unassigned})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ASSIGNED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  filterMode === 'ASSIGNED' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                Assigned ({metrics.assigned})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search request code, customer, city..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Assignment Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Request Code & Date</th>
                <th className="py-3 px-3">Homeowner & Contact</th>
                <th className="py-3 px-3">Location & Plot Area</th>
                <th className="py-3 px-3">Service Scope & Budget</th>
                <th className="py-3 px-3">Currently Assigned Partners</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Assignment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No requests match your active assignment filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isAssigned = req.assignedProfessionalIds && req.assignedProfessionalIds.length > 0;
                  const assignedCount = req.assignedProfessionals?.length || req.assignedProfessionalIds?.length || 0;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <strong className="text-blue-700 font-mono block text-xs">
                          {req.requestCode || req.id.slice(0, 8)}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(req.createdAt)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <strong className="text-slate-900 block">{req.customerName}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">{req.customerPhone}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-slate-800 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{req.city || req.locality || 'Delhi NCR'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {req.plotArea ? `${req.plotArea} sq ft` : 'Plot dimensions provided'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block capitalize">
                          {req.categorySlug?.replace(/-/g, ' ') || 'Architecture & Design'}
                        </span>
                        <span className="text-[11px] text-indigo-700 font-medium">
                          Budget: {req.budgetRange || 'Flexible'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {!isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Assignment</span>
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900">
                              <ShieldCheck className="w-3 h-3 text-indigo-600" />
                              <span>{assignedCount} Firms Allocated</span>
                            </span>
                            {req.assignedProfessionals && (
                              <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                                {req.assignedProfessionals.map((p: any) => p.firmName || p.name).join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'ASSIGNED' || req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openAssignModal(req)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                            !isAssigned
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>{!isAssigned ? 'Assign Architects' : 'Reassign / Add'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Architect Allocation Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold uppercase mb-1">
                  <span>Dispatch Console</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950 font-display">
                  Assign Architects to Request: {selectedRequest.requestCode || selectedRequest.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Select one or more Council of Architecture (COA) certified partner firms to prepare competitive BOQs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Brief Summary Strip */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Homeowner</span>
                <strong className="text-slate-900 block">{selectedRequest.customerName}</strong>
                <span className="text-[11px] text-slate-500">{selectedRequest.customerPhone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Site Location</span>
                <strong className="text-slate-900 block">{selectedRequest.city || 'Delhi NCR'}</strong>
                <span className="text-[11px] text-slate-500">{selectedRequest.locality || 'Site Plot'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Plot Dimensions</span>
                <strong className="text-slate-900 block">
                  {selectedRequest.plotArea ? `${selectedRequest.plotArea} sq ft` : 'Custom plot'}
                </strong>
                <span className="text-[11px] text-slate-500">{selectedRequest.propertyType || 'Villa'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Budget</span>
                <strong className="text-emerald-700 block">{selectedRequest.budgetRange || 'Flexible'}</strong>
                <span className="text-[10px] text-emerald-800 font-semibold">₹499 Fee Verified</span>
              </div>
            </div>

            {/* Assignment Controls: Deadline & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quotation Submission Deadline *
                </label>
                <input
                  type="date"
                  value={responseDeadline}
                  onChange={(e) => setResponseDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Routing Instructions for Architect Partners
                </label>
                <input
                  type="text"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  placeholder="e.g. Include 3D elevation renders and BOQ breakdown..."
                />
              </div>
            </div>

            {/* Architect Selection Grid */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="font-bold text-slate-900 text-xs">
                  Select Certified Architects ({selectedArchitectIds.length} Selected)
                </span>

                <div className="flex items-center gap-2">
                  {/* City Filter */}
                  {uniqueCities.length > 0 && (
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                    >
                      <option value="ALL">All Cities</option>
                      {uniqueCities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}

                  {/* Search */}
                  <input
                    type="text"
                    value={architectSearch}
                    onChange={(e) => setArchitectSearch(e.target.value)}
                    placeholder="Search architect name, firm, COA..."
                    className="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 focus:outline-none"
                  />
                </div>
              </div>

              {/* Architect Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                {filteredArchitects.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                    No approved architects match your search.
                  </div>
                ) : (
                  filteredArchitects.map((arch) => {
                    const isSelected = selectedArchitectIds.includes(arch.id);

                    return (
                      <div
                        key={arch.id}
                        onClick={() => toggleArchitect(arch.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1 text-xs">
                          <strong className="text-slate-900 block truncate">{arch.name}</strong>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {arch.firmName || 'Independent Studio'}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                            <span className="text-indigo-700 font-bold">{arch.coaNumber || 'COA Verified'}</span>
                            <span>•</span>
                            <span>{arch.city || 'Pan-India'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Selected: <strong className="text-indigo-700">{selectedArchitectIds.length} Architects</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssignment}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Dispatch Assignment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
