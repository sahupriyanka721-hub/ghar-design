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
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  getInteriorDesignerAccounts,
  updateInteriorDesignerStatus,
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

  // Remarks Modal State
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'DOCUMENTS_REQUIRED' | 'REJECTED' | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
      success('Interior Designers table refreshed.');
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    loadDesigners();
    window.addEventListener('storage', loadDesigners);

    // Auto-refresh silently every 1 minute (60,000 ms)
    const interval = setInterval(() => {
      handleRefresh(false);
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadDesigners);
    };
  }, []);

  const filtered = designers.filter((d) => {
    const matchesTab = selectedStatusTab === 'ALL' || d.accountStatus === selectedStatusTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.businessName.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.applicationId.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const pendingCount = designers.filter((d) => d.accountStatus === 'PENDING_APPROVAL').length;
  const approvedCount = designers.filter((d) => d.accountStatus === 'APPROVED').length;
  const docsCount = designers.filter((d) => d.accountStatus === 'DOCUMENTS_REQUIRED').length;

  const handleApprove = (id: string) => {
    const updated = updateInteriorDesignerStatus(
      id,
      'APPROVED',
      'Professional credentials, degree, and past portfolio verified. Approved for customer quotation assignments.',
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

  const handleOpenRemarksModal = (action: 'DOCUMENTS_REQUIRED' | 'REJECTED') => {
    setPendingAction(action);
    setRemarksText(
      action === 'DOCUMENTS_REQUIRED'
        ? 'Please re-upload a clear scanned copy of your Degree / Diploma certificate. Also provide at least 2 completed project portfolio photos with client descriptions.'
        : 'Application could not be approved due to unverified professional licensing or insufficient portfolio.'
    );
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
      success(`Status updated to ${pendingAction.replace('_', ' ')} with admin feedback.`);
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
      success(`Document: ${d.title} (No original upload attached)`);
    }
  };

  const handleSuspendToggle = (id: string, currentStatus: InteriorDesignerAccountStatus) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    const remarks =
      nextStatus === 'SUSPENDED'
        ? 'Partner Account temporarily suspended pending compliance review.'
        : 'Partner Account reinstated with active partner access.';

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
    if (window.confirm(`Are you sure you want to permanently delete designer "${name}"? This action cannot be undone.`)) {
      const ok = deleteInteriorDesignerAccount(id);
      if (ok) {
        loadDesigners();
        if (selectedDesigner?.id === id) {
          setSelectedDesigner(null);
        }
        success(`Designer "${name}" deleted successfully.`);
      } else {
        error('Failed to delete designer record.');
      }
    }
  };

  const handleClearAllDesigners = () => {
    if (window.confirm('Are you sure you want to permanently clear all interior designer records? This will reset the list to 0.')) {
      clearAllInteriorDesigners();
      loadDesigners();
      setSelectedDesigner(null);
      success('All interior designer records cleared successfully.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ---------------- TOP BANNER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-black uppercase font-mono mb-1.5">
            <Palette className="w-3.5 h-3.5 text-teal-600" />
            <span>Professional Management • Interior Design Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Interior Designer Applications & KYC
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review firm credentials, portfolio renders, degree certificates, and assign active homeowner quotation rights.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleRefresh(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Auto-refreshes every 1 minute. Click to refresh immediately."
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
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

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {[
          { tab: 'ALL', label: 'All Applications', count: designers.length },
          { tab: 'PENDING_APPROVAL', label: 'Pending Verification', count: pendingCount, highlight: true },
          { tab: 'UNDER_REVIEW', label: 'Under Review', count: designers.filter((d) => d.accountStatus === 'UNDER_REVIEW').length },
          { tab: 'APPROVED', label: 'Approved Partners', count: approvedCount },
          { tab: 'DOCUMENTS_REQUIRED', label: 'Docs Required', count: docsCount },
          { tab: 'REJECTED', label: 'Rejected', count: designers.filter((d) => d.accountStatus === 'REJECTED').length },
          { tab: 'SUSPENDED', label: 'Suspended', count: designers.filter((d) => d.accountStatus === 'SUSPENDED').length },
        ].map((t) => (
          <button
            key={t.tab}
            onClick={() => setSelectedStatusTab(t.tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedStatusTab === t.tab
                ? 'bg-teal-600 text-white shadow-xs'
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by designer, Firm Name, mobile, app ID, city..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500 shadow-2xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Designer & Firm</th>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Entity & Exp</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Specializations</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No interior designer applications found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isApproved = d.accountStatus === 'APPROVED';
                  const isPending = d.accountStatus === 'PENDING_APPROVAL';
                  const isDocs = d.accountStatus === 'DOCUMENTS_REQUIRED';
                  const isSuspended = d.accountStatus === 'SUSPENDED';

                  return (
                    <tr key={d.id} className="hover:bg-teal-50/40 transition">
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => setSelectedDesigner(d)}
                          className="flex items-center gap-3 cursor-pointer group"
                          title="Click to review designer"
                        >
                          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                            {d.profilePhoto ? (
                              <img src={d.profilePhoto} alt={d.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              d.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-navy-950 group-hover:text-teal-600 transition-colors truncate">{d.name}</div>
                            <div className="text-[11px] text-slate-500 group-hover:text-slate-700 truncate">{d.businessName}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">Ph: +91 {d.phone}</div>
                          </div>
                        </div>
                      </td>

                      <td
                        onClick={() => setSelectedDesigner(d)}
                        className="py-3.5 px-4 font-mono font-bold text-teal-800 hover:text-teal-600 hover:underline cursor-pointer"
                        title="Click to review designer"
                      >
                        {d.applicationId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{d.businessType}</div>
                        <div className="text-[11px] text-slate-500">{d.yearsOfExperience} Yrs • Team of {d.teamSize}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{d.city}</div>
                        <div className="text-[10px] text-slate-400">{d.state}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                          {d.specializations?.length || 0} Specializations
                        </span>
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
                            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
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

      {/* ---------------- APPLICATION INSPECTION MODAL ---------------- */}
      <AnimatePresence>
        {selectedDesigner && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedDesigner(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Interior Designers</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {selectedDesigner.name}
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">
                        {selectedDesigner.accountStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {selectedDesigner.firm ? `${selectedDesigner.firm} • ` : ''}{selectedDesigner.city || ''} • {selectedDesigner.phone}
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

            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Body */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* 1. Personal Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-navy-950 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>Lead Interior Designer</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <div>Email: <strong className="text-navy-950">{selectedDesigner.email}</strong></div>
                    <div>Phone: <strong className="text-navy-950 font-mono">+91 {selectedDesigner.phone}</strong></div>
                    <div>Residential: <strong className="text-navy-950">{selectedDesigner.residentialAddress || selectedDesigner.city}</strong></div>
                    <div>Experience: <strong className="text-navy-950">{selectedDesigner.yearsOfExperience} Years</strong></div>
                  </div>
                </div>

                {/* 2. Business & Firm */}
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
                  <div className="font-bold text-navy-950 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>Firm Details & Capabilities</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <div>Entity: <strong className="text-navy-950">{selectedDesigner.businessType}</strong></div>
                    <div>Team Size: <strong className="text-navy-950">{selectedDesigner.teamSize} Members</strong></div>
                    <div>Completed Projects: <strong className="text-navy-950">{selectedDesigner.completedProjectsCount}</strong></div>
                    <div>Pricing Method: <strong className="text-navy-950">{selectedDesigner.pricingMethod}</strong></div>
                    <div>Min Budget: <strong className="text-navy-950">₹{(selectedDesigner.minProjectBudget / 100000).toFixed(1)} Lakhs</strong></div>
                    <div>Max Budget: <strong className="text-navy-950">₹{(selectedDesigner.maxProjectBudget / 100000).toFixed(1)} Lakhs</strong></div>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-teal-200">
                    Office Address: <strong className="text-navy-950">{selectedDesigner.businessAddress}</strong>
                  </div>
                </div>

                {/* 3. Specializations */}
                <div>
                  <div className="font-bold text-navy-950 flex items-center gap-2 mb-2 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>Specializations ({selectedDesigner.specializations?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDesigner.specializations?.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Qualifications */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-navy-950 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4 text-teal-600" />
                    <span>Professional Qualifications</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <div>Highest: <strong className="text-navy-950">{selectedDesigner.highestQualification}</strong></div>
                    <div>Degree: <strong className="text-navy-950">{selectedDesigner.degreeName}</strong></div>
                    <div>Institution: <strong className="text-navy-950">{selectedDesigner.institutionName} ({selectedDesigner.completionYear})</strong></div>
                    <div>Certifications: <strong className="text-navy-950">{selectedDesigner.certifications || 'None'}</strong></div>
                  </div>
                </div>

                {/* 5. Portfolio */}
                <div>
                  <div className="font-bold text-navy-950 flex items-center gap-2 mb-2 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Delivered Portfolio ({selectedDesigner.portfolioProjects?.length || 0})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDesigner.portfolioProjects?.map((p) => (
                      <div key={p.id} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <div className="h-28 rounded-xl overflow-hidden mb-2 bg-slate-100">
                          <img src={p.renderImageUrl || p.afterImageUrl} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-navy-950 text-xs">{p.title}</div>
                        <div className="text-[11px] text-slate-500">{p.location} • {p.builtUpArea}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. KYC Documents */}
                <div>
                  <div className="font-bold text-navy-950 flex items-center gap-2 mb-2 uppercase tracking-wider">
                    <FileCheck2 className="w-4 h-4 text-teal-600" />
                    <span>Submitted Documents</span>
                  </div>
                  <div className="space-y-2">
                    {selectedDesigner.documents?.map((d) => (
                      <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-navy-950">{d.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Status: {d.status}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewDesignerDoc(d)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[11px] font-bold hover:bg-teal-700 transition cursor-pointer"
                        >
                          View Original File
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Admin Remarks */}
                {selectedDesigner.adminReviewRemarks && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <div className="font-bold mb-0.5">Recorded Review Remarks:</div>
                    <p className="text-[11px]">{selectedDesigner.adminReviewRemarks}</p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSuspendToggle(selectedDesigner.id, selectedDesigner.accountStatus)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  >
                    {selectedDesigner.accountStatus === 'SUSPENDED' ? 'Reactivate Account' : 'Suspend Account'}
                  </button>

                  <button
                    onClick={() => handleDeleteDesigner(selectedDesigner.id, selectedDesigner.name)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Record</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRemarksModal('REJECTED')}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                  >
                    Reject Application
                  </button>

                  <button
                    onClick={() => handleOpenRemarksModal('DOCUMENTS_REQUIRED')}
                    className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold transition"
                  >
                    Request Documents
                  </button>

                  <button
                    onClick={() => handleApprove(selectedDesigner.id)}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black shadow-md transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Partner</span>
                  </button>
                </div>
              </div>
            
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- REMARKS / FEEDBACK FULL-SCREEN VIEW ---------------- */}
      {showRemarksModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-60 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowRemarksModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Interior Designers</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                  {pendingAction === 'DOCUMENTS_REQUIRED' ? 'Request Additional Documents' : 'Reject Application'}
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
                  Official Verification Notice / Feedback for {selectedDesigner?.name}: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  placeholder="Specify exact missing portfolio drawings, qualification credentials, or rejection grounds."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRemarksModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemarksAction}
                  className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-md transition ${
                    pendingAction === 'DOCUMENTS_REQUIRED' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'
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
