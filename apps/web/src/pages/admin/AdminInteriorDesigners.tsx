import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  Eye,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Layers,
  FileText,
  FileCheck2,
  X,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Sliders,
  DollarSign,
  Award,
  CreditCard,
  Trash2,
  Lock,
  Check,
  MessageSquare,
  Send,
  History,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  getInteriorDesignerAccounts,
  updateInteriorDesignerStatus,
  verifyDesignerKyc,
  verifyDesignerBusiness,
  updateDocumentVerificationStatus,
  addDesignerInternalNote,
  deleteInteriorDesignerAccount,
  clearAllInteriorDesigners,
  InteriorDesignerAccount,
  InteriorDesignerAccountStatus,
} from '../../data/interiorDesignerStore.js';
import { getOriginalFile, downloadOriginalDocument } from '../../lib/documentStore.js';

export const AdminInteriorDesigners: React.FC = () => {
  const { success, error } = useToast();
  const [designers, setDesigners] = useState<InteriorDesignerAccount[]>([]);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesigner, setSelectedDesigner] = useState<InteriorDesignerAccount | null>(null);

  // Remarks / Feedback Action Modal State
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'DOCUMENTS_REQUIRED' | 'RESUBMISSION_REQUIRED' | 'REJECTED' | null
  >(null);
  const [remarksText, setRemarksText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Internal Note State
  const [internalNoteText, setInternalNoteText] = useState('');

  // Per-document rejection modal
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [docRejectionReason, setDocRejectionReason] = useState('');

  const selectedDesignerRef = useRef<InteriorDesignerAccount | null>(selectedDesigner);
  selectedDesignerRef.current = selectedDesigner;

  const loadDesigners = () => {
    const list = getInteriorDesignerAccounts();
    setDesigners([...list]);
    if (selectedDesignerRef.current) {
      const refreshed = list.find((d) => d.id === selectedDesignerRef.current?.id);
      if (refreshed) setSelectedDesigner(refreshed);
    }
  };

  const handleRefresh = (manual = false) => {
    setRefreshing(true);
    loadDesigners();
    if (manual) {
      success('Interior Designers registry refreshed.');
    }
    setTimeout(() => setRefreshing(false), 400);
  };

  useEffect(() => {
    loadDesigners();
    window.addEventListener('storage', loadDesigners);
    window.addEventListener('interior_designer_store_updated', loadDesigners);
    window.addEventListener('admin_global_refresh', loadDesigners);

    const interval = setInterval(() => {
      handleRefresh(false);
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadDesigners);
      window.removeEventListener('interior_designer_store_updated', loadDesigners);
      window.removeEventListener('admin_global_refresh', loadDesigners);
    };
  }, []);

  const filtered = designers.filter((d) => {
    let matchesTab = true;
    if (selectedStatusTab === 'PENDING') {
      matchesTab =
        d.accountStatus === 'PENDING_APPROVAL' ||
        d.accountStatus === 'SUBMITTED' ||
        d.accountStatus === 'PENDING_REVIEW' ||
        d.accountStatus === 'UNDER_VERIFICATION';
    } else if (selectedStatusTab === 'SUSPENDED') {
      matchesTab = d.accountStatus === 'SUSPENDED' || d.accountStatus === 'DEACTIVATED';
    } else if (selectedStatusTab !== 'ALL') {
      matchesTab = d.accountStatus === selectedStatusTab;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.name?.toLowerCase().includes(q) ||
      d.businessName?.toLowerCase().includes(q) ||
      d.phone?.includes(q) ||
      d.applicationId?.toLowerCase().includes(q) ||
      d.city?.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const pendingCount = designers.filter(
    (d) =>
      d.accountStatus === 'PENDING_APPROVAL' ||
      d.accountStatus === 'SUBMITTED' ||
      d.accountStatus === 'PENDING_REVIEW' ||
      d.accountStatus === 'UNDER_VERIFICATION'
  ).length;
  const approvedCount = designers.filter((d) => d.accountStatus === 'APPROVED').length;
  const docsCount = designers.filter((d) => d.accountStatus === 'DOCUMENTS_REQUIRED').length;
  const resubmitCount = designers.filter((d) => d.accountStatus === 'RESUBMISSION_REQUIRED').length;
  const rejectedCount = designers.filter((d) => d.accountStatus === 'REJECTED').length;
  const suspendedCount = designers.filter(
    (d) => d.accountStatus === 'SUSPENDED' || d.accountStatus === 'DEACTIVATED'
  ).length;

  // ---------------- ACTION HANDLERS ----------------
  const handleApprove = (id: string) => {
    const updated = updateInteriorDesignerStatus(
      id,
      'APPROVED',
      'Professional credentials, design qualifications, degree certificate, and past portfolio verified. Account approved for BuildGhar project assignments.',
      'Super Admin Operations Desk'
    );
    if (updated) {
      loadDesigners();
      if (selectedDesigner?.id === id) {
        setSelectedDesigner({ ...updated });
      }
      success(`Interior Designer "${updated.name}" approved successfully!`);
    }
  };

  const handleOpenRemarksModal = (
    action: 'DOCUMENTS_REQUIRED' | 'RESUBMISSION_REQUIRED' | 'REJECTED'
  ) => {
    setPendingAction(action);
    if (action === 'DOCUMENTS_REQUIRED') {
      setRemarksText(
        'Please re-upload a clear scanned copy of your Degree Certificate and Cancelled Cheque for bank escrow verification. Also attach at least 2 completed project photos.'
      );
    } else if (action === 'RESUBMISSION_REQUIRED') {
      setRemarksText(
        'Please update your Business Registration details and verify that your registered GST number matches your firm trade name before resubmission.'
      );
    } else {
      setRemarksText(
        'Application could not be approved due to unverified professional licensing or insufficient portfolio records.'
      );
    }
    setShowRemarksModal(true);
  };

  const handleConfirmRemarksAction = () => {
    if (!selectedDesigner || !pendingAction) return;

    if (!remarksText.trim()) {
      error('Please provide specific remarks for the designer');
      return;
    }

    const updated = updateInteriorDesignerStatus(
      selectedDesigner.id,
      pendingAction,
      remarksText.trim(),
      'Super Admin Governance'
    );

    if (updated) {
      loadDesigners();
      setSelectedDesigner({ ...updated });
      setShowRemarksModal(false);
      setPendingAction(null);
      setRemarksText('');
      success(`Status updated to ${pendingAction.replace('_', ' ')} with official notification.`);
    }
  };

  const handleVerifyKycClick = (id: string) => {
    const updated = verifyDesignerKyc(id, 'Super Admin KYC Desk');
    if (updated) {
      loadDesigners();
      setSelectedDesigner({ ...updated });
      success('KYC verified! All documents marked as verified.');
    }
  };

  const handleVerifyBusinessClick = (id: string) => {
    const updated = verifyDesignerBusiness(id, 'Super Admin Business Desk');
    if (updated) {
      loadDesigners();
      setSelectedDesigner({ ...updated });
      success('Business registration and entity status verified.');
    }
  };

  const handleDocStatusToggle = (
    docId: string,
    targetStatus: 'VERIFIED' | 'REJECTED',
    reason?: string
  ) => {
    if (!selectedDesigner) return;
    const updated = updateDocumentVerificationStatus(
      selectedDesigner.id,
      docId,
      targetStatus,
      reason
    );
    if (updated) {
      loadDesigners();
      setSelectedDesigner({ ...updated });
      setRejectingDocId(null);
      setDocRejectionReason('');
      success(`Document marked as ${targetStatus}.`);
    }
  };

  const handleAddInternalNoteClick = () => {
    if (!selectedDesigner || !internalNoteText.trim()) {
      error('Please enter note text');
      return;
    }
    const updated = addDesignerInternalNote(
      selectedDesigner.id,
      internalNoteText.trim(),
      'Admin Operations Desk'
    );
    if (updated) {
      loadDesigners();
      setSelectedDesigner({ ...updated });
      setInternalNoteText('');
      success('Internal audit note recorded.');
    }
  };

  const handleViewDesignerDoc = async (d: any) => {
    const cleanPhone = (selectedDesigner?.phone || '').replace(/\D/g, '').slice(-10);
    const key = d.storageKey || `designer_doc_${cleanPhone}_${d.id}` || d.id;
    let dataUrl = d.fileUrl;
    let fileName = d.fileName || `${d.title}.pdf`;

    if (!dataUrl || dataUrl === '#' || dataUrl.startsWith('indexeddb:')) {
      const vaultDoc = await getOriginalFile(key);
      if (vaultDoc && vaultDoc.dataUrl) {
        dataUrl = vaultDoc.dataUrl;
        fileName = vaultDoc.name || fileName;
      }
    }

    if (dataUrl && dataUrl.startsWith('data:')) {
      downloadOriginalDocument({ name: fileName, dataUrl });
      success(`Downloading original file: ${fileName}`);
    } else {
      success(`Document: ${d.title} (No external file payload attached)`);
    }
  };

  const handleSuspendToggle = (id: string, currentStatus: InteriorDesignerAccountStatus) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    const remarks =
      nextStatus === 'SUSPENDED'
        ? 'Partner Account temporarily suspended pending compliance audit.'
        : 'Partner Account reinstated with active quotation assignment access.';

    const updated = updateInteriorDesignerStatus(id, nextStatus, remarks, 'Super Admin Governance');
    if (updated) {
      loadDesigners();
      if (selectedDesigner?.id === id) {
        setSelectedDesigner({ ...updated });
      }
      success(`Designer account ${nextStatus === 'SUSPENDED' ? 'suspended' : 'reinstated'}.`);
    }
  };

  const handleDeleteDesigner = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete designer "${name}"? This action cannot be undone.`
      )
    ) {
      const ok = deleteInteriorDesignerAccount(id);
      if (ok) {
        loadDesigners();
        if (selectedDesigner?.id === id) {
          setSelectedDesigner(null);
        }
        success(`Designer "${name}" deleted.`);
      } else {
        error('Failed to delete designer record.');
      }
    }
  };

  const handleClearAllDesigners = () => {
    if (
      window.confirm(
        'Are you sure you want to permanently clear all interior designer records? This will reset the list to 0.'
      )
    ) {
      clearAllInteriorDesigners();
      loadDesigners();
      setSelectedDesigner(null);
      success('All interior designer records cleared.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ---------------- TOP BANNER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase font-mono mb-1.5">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Professional Management • Interior Designer Applications & KYC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Interior Designer Applications & KYC Governance Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review practice credentials, verify statutory documents, inspect 3D portfolio renders, and authorize project assignments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleRefresh(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Auto-refreshes every 1 minute. Click to refresh immediately."
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleClearAllDesigners}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Clear all interior designer records from database"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear Designers</span>
          </button>
        </div>
      </div>

      {/* ---------------- STATUS FILTER TABS ---------------- */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {[
          { tab: 'ALL', label: 'All Applications', count: designers.length },
          { tab: 'PENDING', label: 'Pending Review', count: pendingCount, highlight: true },
          { tab: 'APPROVED', label: 'Approved Partners', count: approvedCount },
          { tab: 'DOCUMENTS_REQUIRED', label: 'Docs Required', count: docsCount },
          { tab: 'RESUBMISSION_REQUIRED', label: 'Resubmission Required', count: resubmitCount },
          { tab: 'REJECTED', label: 'Rejected', count: rejectedCount },
          { tab: 'SUSPENDED', label: 'Suspended / Inactive', count: suspendedCount },
        ].map((t) => (
          <button
            key={t.tab}
            onClick={() => setSelectedStatusTab(t.tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedStatusTab === t.tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                selectedStatusTab === t.tab
                  ? 'bg-white/20 text-white'
                  : t.highlight && t.count > 0
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ---------------- SEARCH BAR ---------------- */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by designer, firm, mobile (+91), ID, city..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* ---------------- APPLICATIONS TABLE ---------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Designer & Studio</th>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Entity & Exp</th>
                <th className="py-3 px-4">City / Reach</th>
                <th className="py-3 px-4">Services / KYC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No interior designer applications found matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isApproved = d.accountStatus === 'APPROVED';
                  const isPending =
                    d.accountStatus === 'PENDING_APPROVAL' ||
                    d.accountStatus === 'SUBMITTED' ||
                    d.accountStatus === 'PENDING_REVIEW' ||
                    d.accountStatus === 'UNDER_VERIFICATION';
                  const isDocs = d.accountStatus === 'DOCUMENTS_REQUIRED';
                  const isResubmit = d.accountStatus === 'RESUBMISSION_REQUIRED';
                  const isSuspended =
                    d.accountStatus === 'SUSPENDED' || d.accountStatus === 'DEACTIVATED';

                  return (
                    <tr key={d.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => setSelectedDesigner(d)}
                          className="flex items-center gap-3 cursor-pointer group"
                          title="Click to review designer application"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                            {d.profilePhoto ? (
                              <img
                                src={d.profilePhoto}
                                alt={d.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              d.name?.charAt(0) || 'D'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-navy-950 group-hover:text-blue-600 transition-colors truncate">
                              {d.name}
                            </div>
                            <div className="text-[11px] text-slate-500 group-hover:text-slate-700 truncate">
                              {d.businessName || 'Independent Practice'}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              Ph: +91 {d.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        onClick={() => setSelectedDesigner(d)}
                        className="py-3.5 px-4 font-mono font-bold text-blue-800 hover:text-blue-600 hover:underline cursor-pointer"
                        title="Click to review designer"
                      >
                        {d.applicationId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{d.businessType}</div>
                        <div className="text-[11px] text-slate-500">
                          {d.yearsOfExperience} Yrs Exp • Team of {d.teamSize}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{d.city || 'Delhi NCR'}</div>
                        <div className="text-[10px] text-slate-400">{d.state}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                            {(d.servicesOffered || d.specializations)?.length || 0} Services
                          </span>
                          {d.isKycVerified ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <Check className="w-3 h-3" />
                              <span>KYC</span>
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              KYC Pending
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : isDocs
                              ? 'bg-sky-100 text-sky-900 border border-sky-300'
                              : isResubmit
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : isSuspended
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {d.accountStatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDesigner(d)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDesigner(d.id, d.name)}
                            title="Delete Designer Record"
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- FULL-SCREEN APPLICATION INSPECTION MODAL ---------------- */}
      <AnimatePresence>
        {selectedDesigner && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />

            {/* Modal Header */}
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedDesigner(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Applications</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <Palette className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {selectedDesigner.name}
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">
                        {selectedDesigner.accountStatus}
                      </span>
                      {selectedDesigner.isKycVerified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          KYC Verified
                        </span>
                      )}
                      {selectedDesigner.isBusinessVerified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          Business Verified
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      App ID: {selectedDesigner.applicationId} • Ph: +91 {selectedDesigner.phone} •{' '}
                      {selectedDesigner.city}, {selectedDesigner.state}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => setSelectedDesigner(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Quick Verification Toolbar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Governance Verification:</span>
                  <button
                    type="button"
                    onClick={() => handleVerifyBusinessClick(selectedDesigner.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedDesigner.isBusinessVerified
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedDesigner.isBusinessVerified ? 'Business Verified ✓' : 'Verify Business Entity'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyKycClick(selectedDesigner.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedDesigner.isKycVerified
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{selectedDesigner.isKycVerified ? 'All KYC Verified ✓' : 'Verify Complete KYC'}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Registered: {new Date(selectedDesigner.registeredAt || 0).toLocaleDateString()} • Last Update:{' '}
                  {new Date(selectedDesigner.updatedAt || 0).toLocaleTimeString()}
                </div>
              </div>

              {/* Grid of All Application Details (Sections A to H) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                {/* 1. Step A: Personal Information */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="font-black text-navy-950 flex items-center gap-2 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Step A: Personal & Contact Profile</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                    <div>Name: <strong className="text-navy-950">{selectedDesigner.name}</strong></div>
                    <div>Mobile: <strong className="font-mono text-navy-950">+91 {selectedDesigner.phone}</strong></div>
                    <div>Email: <strong className="text-navy-950">{selectedDesigner.email}</strong></div>
                    <div>Alternate Ph: <strong className="font-mono text-navy-950">{selectedDesigner.alternatePhone || 'None'}</strong></div>
                    <div>Gender: <strong className="text-navy-950">{selectedDesigner.gender || 'Not specified'}</strong></div>
                    <div>DOB: <strong className="text-navy-950">{selectedDesigner.dob || 'Not provided'}</strong></div>
                    <div className="sm:col-span-2">
                      Residential Address:{' '}
                      <strong className="text-navy-950">
                        {selectedDesigner.residentialAddress || `${selectedDesigner.city}, ${selectedDesigner.state} - ${selectedDesigner.pincode}`}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Step B: Business Details */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="font-black text-navy-950 flex items-center gap-2 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Step B: Business & Studio Operations</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                    <div>Firm Name: <strong className="text-navy-950">{selectedDesigner.businessName || 'Independent'}</strong></div>
                    <div>Entity Type: <strong className="text-navy-950">{selectedDesigner.businessType}</strong></div>
                    <div>Registration: <strong className="text-navy-950">{selectedDesigner.businessRegistrationType || 'Private Limited'}</strong></div>
                    <div>Experience: <strong className="text-navy-950">{selectedDesigner.yearsOfExperience} Years</strong></div>
                    <div>Team Size: <strong className="text-navy-950">{selectedDesigner.teamSize} Members</strong></div>
                    <div>Completed Projects: <strong className="text-navy-950">{selectedDesigner.completedProjectsCount}</strong></div>
                    <div>GSTIN: <strong className="font-mono text-navy-950">{selectedDesigner.gstNumber || 'Not Registered'}</strong></div>
                    <div>Registration No: <strong className="font-mono text-navy-950">{selectedDesigner.businessRegistrationNumber || 'None'}</strong></div>
                    <div className="sm:col-span-2">
                      Office Address: <strong className="text-navy-950">{selectedDesigner.businessAddress}</strong>
                    </div>
                    {selectedDesigner.businessDescription && (
                      <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 italic">
                        "{selectedDesigner.businessDescription}"
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Step C: Qualification and Experience */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="font-black text-navy-950 flex items-center gap-2 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Step C: Qualifications & Accreditations</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                    <div>Highest: <strong className="text-navy-950">{selectedDesigner.highestQualification}</strong></div>
                    <div>Degree: <strong className="text-navy-950">{selectedDesigner.degreeName}</strong></div>
                    <div>Institution: <strong className="text-navy-950">{selectedDesigner.institutionName}</strong></div>
                    <div>Year of Completion: <strong className="text-navy-950">{selectedDesigner.completionYear}</strong></div>
                    <div>Specialization: <strong className="text-navy-950">{selectedDesigner.specialization || 'Contemporary Luxury'}</strong></div>
                    <div>Registration: <strong className="text-navy-950">{selectedDesigner.professionalRegistration || 'None'}</strong></div>
                    <div className="sm:col-span-2">
                      Certifications: <strong className="text-navy-950">{selectedDesigner.certifications || 'AutoCAD, 3ds Max'}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Step D: Services Offered (23 Services) */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="font-black text-navy-950 flex items-center justify-between uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Step D: Services Offered ({(selectedDesigner.servicesOffered || selectedDesigner.specializations)?.length || 0})</span>
                    </span>
                    <span className="font-mono text-blue-700 font-bold">
                      {selectedDesigner.pricingMethod || 'Per Square Foot'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {(selectedDesigner.servicesOffered || selectedDesigner.specializations)?.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-slate-600">
                    <div>Min Budget: <strong className="text-navy-950">₹{((selectedDesigner.minProjectBudget || 0) / 100000).toFixed(1)} Lakhs</strong></div>
                    <div>Max Budget: <strong className="text-navy-950">₹{((selectedDesigner.maxProjectBudget || 0) / 100000).toFixed(1)} Lakhs</strong></div>
                    <div>Consultation Fee: <strong className="text-navy-950">₹{selectedDesigner.consultationFee || 0}</strong></div>
                    <div>Provides Materials: <strong className="text-navy-950">{selectedDesigner.providesMaterials ? 'Yes' : 'No'}</strong></div>
                  </div>
                </div>

                {/* 5. Step G: Service Areas & Reach */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="font-black text-navy-950 flex items-center gap-2 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Step G: Service Areas & Consultation Scope</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                    <div>State: <strong className="text-navy-950">{selectedDesigner.state || 'Delhi NCR'}</strong></div>
                    <div>Operating Radius: <strong className="text-navy-950">{selectedDesigner.serviceRadiusKm || 50} km</strong></div>
                    <div className="sm:col-span-2">
                      Primary Operating Cities:
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(selectedDesigner.serviceCities || [selectedDesigner.city]).map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      Covered PIN Codes: <strong className="font-mono text-navy-950">{selectedDesigner.servicePincodes?.join(', ') || selectedDesigner.pincode}</strong>
                    </div>
                    <div>On-Site Services: <strong className="text-emerald-700 font-bold">{selectedDesigner.onSiteServiceAvailable !== false ? 'Available ✓' : 'No'}</strong></div>
                    <div>Online Consultation: <strong className="text-blue-700 font-bold">{selectedDesigner.onlineConsultationAvailable !== false ? 'Available ✓' : 'No'}</strong></div>
                  </div>
                </div>

                {/* 6. Step H: Bank & Escrow Settlement */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="font-black text-navy-950 flex items-center gap-2 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Step H: Bank & Escrow Payouts (Finance Restricted)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                    <div>Account Holder: <strong className="text-navy-950">{selectedDesigner.bankDetails?.accountHolderName || selectedDesigner.name}</strong></div>
                    <div>Bank Name: <strong className="text-navy-950">{selectedDesigner.bankDetails?.bankName || 'HDFC Bank'}</strong></div>
                    <div>
                      Account Number:{' '}
                      <strong className="font-mono text-navy-950">
                        {selectedDesigner.bankDetails?.accountNumber
                          ? `•••• •••• •••• ${selectedDesigner.bankDetails.accountNumber.slice(-4)}`
                          : 'Not Provided'}
                      </strong>
                    </div>
                    <div>IFSC Code: <strong className="font-mono uppercase text-navy-950">{selectedDesigner.bankDetails?.ifscCode || 'None'}</strong></div>
                    <div>Branch: <strong className="text-navy-950">{selectedDesigner.bankDetails?.branch || selectedDesigner.city}</strong></div>
                    <div>Account Type: <strong className="text-navy-950">{selectedDesigner.bankDetails?.accountType || 'Current'} Account</strong></div>
                    <div>UPI ID: <strong className="font-mono text-navy-950">{selectedDesigner.bankDetails?.upiId || 'None'}</strong></div>
                  </div>
                </div>
              </div>

              {/* 7. Step E: Delivered Portfolio Showcase */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="font-black text-navy-950 flex items-center justify-between uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Step E: Portfolio Projects ({selectedDesigner.portfolioProjects?.length || 0})</span>
                  </span>
                </div>
                {selectedDesigner.portfolioProjects?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No past portfolio entries uploaded.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedDesigner.portfolioProjects?.map((p) => (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-2">
                        <div className="h-32 rounded-xl overflow-hidden bg-slate-200">
                          <img
                            src={p.renderImageUrl || p.afterImageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-bold text-navy-950 text-xs">{p.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.location} • {p.builtUpArea} • Completed: {p.completionYear}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{p.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. Step F: KYC Documents with Individual Review Controls */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="font-black text-navy-950 flex items-center justify-between uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    <span>Step F: Statutory KYC Documents Verification ({selectedDesigner.documents?.length || 0})</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedDesigner.documents?.map((d) => {
                    const isVerified = d.status === 'VERIFIED';
                    const isRejected = d.status === 'REJECTED';

                    return (
                      <div
                        key={d.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isVerified
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : isRejected
                            ? 'bg-rose-50/50 border-rose-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-navy-950 text-xs">{d.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Status:{' '}
                              <span
                                className={`font-bold uppercase ${
                                  isVerified ? 'text-emerald-700' : isRejected ? 'text-rose-700' : 'text-amber-700'
                                }`}
                              >
                                {d.status}
                              </span>
                              {d.fileSize ? ` • ${d.fileSize}` : ''}
                            </div>
                            {d.rejectionReason && (
                              <div className="text-[10px] text-rose-600 mt-1 italic">
                                Reason: {d.rejectionReason}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleViewDesignerDoc(d)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold transition cursor-pointer"
                          >
                            View File
                          </button>
                        </div>

                        {/* Document Verification Action Buttons */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60">
                          {rejectingDocId === d.id ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input
                                type="text"
                                value={docRejectionReason}
                                onChange={(e) => setDocRejectionReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                className="flex-1 px-2 py-1 bg-white border border-rose-300 rounded-lg text-[11px] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleDocStatusToggle(d.id, 'REJECTED', docRejectionReason)}
                                className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingDocId(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDocStatusToggle(d.id, 'VERIFIED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify Document</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingDocId(d.id);
                                  setDocRejectionReason('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 9. Internal Notes & Audit History (Private to Admin) */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="font-black text-navy-950 flex items-center justify-between uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Admin Internal Audit Notes (Private to Operations Desk)</span>
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    placeholder="Add confidential admin verification observation or compliance note..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddInternalNoteClick}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>

                {selectedDesigner.adminInternalNotes && selectedDesigner.adminInternalNotes.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedDesigner.adminInternalNotes.map((note, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                        {note}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No internal notes recorded yet.</p>
                )}

                {/* Status History Trail */}
                {selectedDesigner.statusHistory && selectedDesigner.statusHistory.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Status Change Audit Trail:</span>
                    </div>
                    <div className="space-y-1 text-[11px] font-mono text-slate-600">
                      {selectedDesigner.statusHistory.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                          <span>
                            <strong>{h.status}</strong> by {h.changedBy} ({new Date(h.timestamp).toLocaleString()}): {h.remarks || 'No remarks'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSuspendToggle(selectedDesigner.id, selectedDesigner.accountStatus)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  {selectedDesigner.accountStatus === 'SUSPENDED' ? 'Reactivate Account' : 'Suspend Account'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteDesigner(selectedDesigner.id, selectedDesigner.name)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Record</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenRemarksModal('REJECTED')}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                >
                  Reject Application
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRemarksModal('RESUBMISSION_REQUIRED')}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition cursor-pointer"
                >
                  Request Corrections
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRemarksModal('DOCUMENTS_REQUIRED')}
                  className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold transition cursor-pointer"
                >
                  Request Documents
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedDesigner.id)}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Authorize Partner</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- REMARKS / FEEDBACK ACTION MODAL ---------------- */}
      {showRemarksModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-60 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowRemarksModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Applications</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                  {pendingAction === 'DOCUMENTS_REQUIRED'
                    ? 'Request Additional Documents'
                    : pendingAction === 'RESUBMISSION_REQUIRED'
                    ? 'Send Correction Request'
                    : 'Reject Application'}
                </h2>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  Compliance Feedback & Verification • {selectedDesigner?.name || 'Designer'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRemarksModal(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1000px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Official Verification Notice / Action Reason for {selectedDesigner?.name}:{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  placeholder="Specify exact missing statutory documents, degree credential verification issues, or required corrections."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRemarksModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemarksAction}
                  className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-md transition cursor-pointer ${
                    pendingAction === 'DOCUMENTS_REQUIRED'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : pendingAction === 'RESUBMISSION_REQUIRED'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm & Send Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
