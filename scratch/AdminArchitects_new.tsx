import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
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
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Layers,
  FileText,
  FileCheck2,
  CreditCard,
  X,
  ArrowLeft,
  Filter,
  Check,
  Sparkles,
  Sliders,
  RotateCcw,
  Trash2,
  Star,
  Tag,
  StickyNote,
  Share2,
  Send,
  MessageSquare,
  Percent,
  Copy,
  MessageCircle,
  Calendar,
  Award,
  Plus,
  Gift,
  SendHorizontal,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { pullFromCloud } from '../../data/cloudSync.js';
import {
  getArchitectAccounts,
  updateArchitectStatus,
  deleteArchitectAccount,
  clearAllArchitects,
  ArchitectAccount,
  ArchitectAccountStatus,
  addArchitectNote,
  deleteArchitectNote,
  saveArchitectReview,
  saveArchitectDiscount,
  shareArchitectWithCustomer,
} from '../../data/architectStore.js';
import {
  getRegisteredCustomers,
  RegisteredCustomer,
} from '../../data/customerStore.js';

export const AdminArchitects: React.FC = () => {
  const { success, error } = useToast();
  const [architects, setArchitects] = useState<ArchitectAccount[]>([]);
  const [customers, setCustomers] = useState<RegisteredCustomer[]>([]);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchitect, setSelectedArchitect] = useState<ArchitectAccount | null>(null);

  // Active Tab inside Dossier Modal
  const [activeDossierTab, setActiveDossierTab] = useState<'CREDENTIALS' | 'REVIEW' | 'NOTES' | 'DISCOUNT' | 'SEND_CUSTOMER'>('CREDENTIALS');

  // Remarks Modal State
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'CHANGES_REQUESTED' | 'REJECTED' | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action Modals
  const [quickSendArch, setQuickSendArch] = useState<ArchitectAccount | null>(null);
  const [quickDiscountArch, setQuickDiscountArch] = useState<ArchitectAccount | null>(null);
  const [quickNotesArch, setQuickNotesArch] = useState<ArchitectAccount | null>(null);
  const [quickReviewArch, setQuickReviewArch] = useState<ArchitectAccount | null>(null);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    qualityScore: 95,
    designAestheticsRating: 5,
    structuralAccuracyRating: 5,
    communicationRating: 5,
    tierBadge: 'VERIFIED_ELITE' as 'STANDARD' | 'VERIFIED_ELITE' | 'MASTER_ARCHITECT',
    summary: 'Council of Architecture verified. High-precision structural and aesthetic blueprints.',
  });

  // Notes Form State
  const [noteText, setNoteText] = useState('');
  const [notePriority, setNotePriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');

  // Discount Form State
  const [discountForm, setDiscountForm] = useState({
    enabled: true,
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    amount: 10,
    code: 'BGARCH10',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    terms: 'Special platform discount applicable on initial 2D architectural blueprint & 3D elevation milestones.',
  });

  // Send to Customer Form State
  const [sendForm, setSendForm] = useState({
    selectedCustomerId: '',
    discountCode: 'BGARCH10',
    discountApplied: '10% OFF',
    customNote: 'Recommended by BuildGhar Central Engineering Desk for verified architectural execution & timely structural drawings.',
    channel: 'ALL' as 'WHATSAPP' | 'SMS' | 'PORTAL' | 'ALL',
  });

  const loadData = () => {
    const list = getArchitectAccounts();
    setArchitects([...list]);
    const custs = getRegisteredCustomers();
    setCustomers([...custs]);

    // Keep selectedArchitect in sync if open
    if (selectedArchitect) {
      const refreshed = list.find((a) => a.id === selectedArchitect.id);
      if (refreshed) setSelectedArchitect(refreshed);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await pullFromCloud();
      loadData();
      success('Architects table refreshed & synced with cloud database!');
    } catch {
      loadData();
      success('Architects table refreshed.');
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  useEffect(() => {
    loadData();
    pullFromCloud().then(() => loadData()).catch(() => {});

    window.addEventListener('storage', loadData);
    window.addEventListener('admin_global_refresh', loadData);
    window.addEventListener('architect_store_updated', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('admin_global_refresh', loadData);
      window.removeEventListener('architect_store_updated', loadData);
    };
  }, []);

  // Filter logic
  const filtered = architects.filter((a) => {
    const matchesTab =
      selectedStatusTab === 'ALL' || a.accountStatus === selectedStatusTab;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.firmName.toLowerCase().includes(q) ||
      a.phone.includes(q) ||
      (a.id && a.id.toLowerCase().includes(q)) ||
      (a.coaNumber && a.coaNumber.toLowerCase().includes(q)) ||
      a.city.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const pendingCount = architects.filter((a) => a.accountStatus === 'PENDING_APPROVAL').length;
  const approvedCount = architects.filter((a) => a.accountStatus === 'APPROVED').length;
  const changesCount = architects.filter((a) => a.accountStatus === 'CHANGES_REQUESTED').length;
  const incompleteCount = architects.filter((a) => a.accountStatus === 'PROFILE_INCOMPLETE').length;

  const handleApprove = (id: string) => {
    const updated = updateArchitectStatus(
      id,
      'APPROVED',
      'COA registration verified with Indian Council of Architecture records. Approved for active landowner RFQs.',
      'Super Admin Review Desk'
    );
    if (updated) {
      loadData();
      if (selectedArchitect?.id === id) {
        setSelectedArchitect({ ...updated });
      }
      success(`Architect "${updated.name}" approved successfully!`);
    }
  };

  const handleOpenRemarksModal = (action: 'CHANGES_REQUESTED' | 'REJECTED') => {
    setPendingAction(action);
    setRemarksText(
      action === 'CHANGES_REQUESTED'
        ? 'Please re-upload a high-resolution scanned copy of your Council of Architecture (COA) registration certificate. The current file is illegible.'
        : 'Application cannot be approved due to unverified professional licensing.'
    );
    setShowRemarksModal(true);
  };

  const handleConfirmRemarksAction = () => {
    if (!selectedArchitect || !pendingAction) return;

    if (!remarksText.trim()) {
      error('Please provide specific remarks for the architect');
      return;
    }

    const updated = updateArchitectStatus(
      selectedArchitect.id,
      pendingAction,
      remarksText.trim(),
      'Super Admin Review Desk'
    );

    if (updated) {
      loadData();
      setSelectedArchitect({ ...updated });
      setShowRemarksModal(false);
      setPendingAction(null);
      setRemarksText('');
      success(`Status updated to ${pendingAction.replace('_', ' ')} with admin feedback.`);
    }
  };

  const handleSuspendToggle = (id: string, currentStatus: ArchitectAccountStatus) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    const remarks =
      nextStatus === 'SUSPENDED'
        ? 'Partner account suspended pending compliance audit.'
        : 'Partner account reinstated.';

    const updated = updateArchitectStatus(id, nextStatus, remarks, 'Super Admin Review Desk');
    if (updated) {
      loadData();
      if (selectedArchitect?.id === id) {
        setSelectedArchitect({ ...updated });
      }
      success(`Architect account ${nextStatus === 'SUSPENDED' ? 'suspended' : 'reinstated'}.`);
    }
  };

  // ---------------- Review Handler ----------------
  const handleOpenReview = (arch: ArchitectAccount) => {
    setReviewForm({
      rating: arch.adminReview?.rating || 5,
      qualityScore: arch.adminReview?.qualityScore || 95,
      designAestheticsRating: arch.adminReview?.designAestheticsRating || 5,
      structuralAccuracyRating: arch.adminReview?.structuralAccuracyRating || 5,
      communicationRating: arch.adminReview?.communicationRating || 5,
      tierBadge: arch.adminReview?.tierBadge || 'VERIFIED_ELITE',
      summary: arch.adminReview?.summary || 'Verified Council of Architecture license, vetted drawings and active municipal sanction experience.',
    });
    setQuickReviewArch(arch);
  };

  const handleSaveReview = (archId: string) => {
    const updated = saveArchitectReview(archId, {
      rating: reviewForm.rating,
      qualityScore: reviewForm.qualityScore,
      designAestheticsRating: reviewForm.designAestheticsRating,
      structuralAccuracyRating: reviewForm.structuralAccuracyRating,
      communicationRating: reviewForm.communicationRating,
      tierBadge: reviewForm.tierBadge,
      summary: reviewForm.summary.trim(),
      reviewedBy: 'Super Admin Governance Desk',
      reviewedAt: new Date().toISOString(),
    });

    if (updated) {
      loadData();
      setQuickReviewArch(null);
      success('Governance Review & Rating saved successfully!');
    }
  };

  // ---------------- Notes Handler ----------------
  const handleOpenNotes = (arch: ArchitectAccount) => {
    setNoteText('');
    setNotePriority('NORMAL');
    setQuickNotesArch(arch);
  };

  const handleAddNote = (archId: string) => {
    if (!noteText.trim()) {
      error('Please enter a note');
      return;
    }
    const updated = addArchitectNote(archId, noteText, 'Super Admin Desk', notePriority);
    if (updated) {
      setNoteText('');
      loadData();
      if (quickNotesArch) {
        setQuickNotesArch(updated);
      }
      success('Internal administrative note recorded!');
    }
  };

  const handleDeleteNote = (archId: string, noteId: string) => {
    const updated = deleteArchitectNote(archId, noteId);
    if (updated) {
      loadData();
      if (quickNotesArch) {
        setQuickNotesArch(updated);
      }
      success('Note deleted.');
    }
  };

  // ---------------- Discount Handler ----------------
  const handleOpenDiscount = (arch: ArchitectAccount) => {
    setDiscountForm({
      enabled: arch.specialDiscount ? arch.specialDiscount.enabled : true,
      type: arch.specialDiscount?.type || 'PERCENTAGE',
      amount: arch.specialDiscount?.amount ?? 10,
      code: arch.specialDiscount?.code || `BGARCH${arch.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}10`,
      validUntil: arch.specialDiscount?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      terms: arch.specialDiscount?.terms || 'Special platform discount applicable on initial 2D architectural blueprint & 3D elevation milestones.',
    });
    setQuickDiscountArch(arch);
  };

  const handleSaveDiscount = (archId: string) => {
    if (discountForm.amount <= 0) {
      error('Discount amount must be greater than 0');
      return;
    }
    const updated = saveArchitectDiscount(archId, {
      enabled: discountForm.enabled,
      type: discountForm.type,
      amount: Number(discountForm.amount),
      code: discountForm.code.trim().toUpperCase() || 'BGARCH10',
      validUntil: discountForm.validUntil,
      terms: discountForm.terms.trim(),
    });

    if (updated) {
      loadData();
      setQuickDiscountArch(null);
      success('Special Architect Discount saved and activated!');
    }
  };

  // ---------------- Send to Customer Handler ----------------
  const handleOpenSend = (arch: ArchitectAccount) => {
    const defaultCust = customers[0];
    const discountCode = arch.specialDiscount?.enabled ? arch.specialDiscount.code : 'BGARCH10';
    const discountApplied = arch.specialDiscount?.enabled
      ? (arch.specialDiscount.type === 'PERCENTAGE' ? `${arch.specialDiscount.amount}% OFF` : `₹${arch.specialDiscount.amount} OFF`)
      : '10% Platform Discount';

    setSendForm({
      selectedCustomerId: defaultCust?.id || '',
      discountCode,
      discountApplied,
      customNote: `Our Central Engineering Desk specifically recommends Architect ${arch.name} (${arch.firmName}) for your architectural blueprints, structural design, and 3D elevation.`,
      channel: 'ALL',
    });
    setQuickSendArch(arch);
  };

  const handleDispatchToCustomer = (arch: ArchitectAccount) => {
    const cust = customers.find((c) => c.id === sendForm.selectedCustomerId);
    if (!cust) {
      error('Please select a customer to send this architect to');
      return;
    }

    try {
      const res = shareArchitectWithCustomer(arch.id, {
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        discountCode: sendForm.discountCode,
        discountApplied: sendForm.discountApplied,
        note: sendForm.customNote,
        channel: sendForm.channel,
      });

      loadData();
      setQuickSendArch(null);
      success(`Architect profile and ${sendForm.discountApplied} voucher sent to ${cust.name}!`);

      if (sendForm.channel === 'WHATSAPP' || sendForm.channel === 'ALL') {
        window.open(res.whatsappUrl, '_blank');
      }
    } catch (e: any) {
      error(e.message || 'Failed to dispatch architect');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-black uppercase font-mono mb-2">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>Architect & Engineering Governance</span>
          </div>
          <h1 className="text-2xl font-black font-display text-navy-950">
            Architect Partners Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review applicant COA certificates, internal notes, special discounts, and dispatch recommendations to registered homeowners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Table'}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to permanently clear all architect accounts from the database? This will reset the list to 0.')) {
                clearAllArchitects();
                loadData();
                success('All architect records cleared successfully!');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Clear all architect records from database"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear Architects</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {[
          { tab: 'ALL', label: 'All Applications', count: architects.length },
          { tab: 'PENDING_APPROVAL', label: 'Pending Verification', count: pendingCount, highlight: true },
          { tab: 'PROFILE_INCOMPLETE', label: 'Draft / Incomplete', count: incompleteCount },
          { tab: 'APPROVED', label: 'Approved Partners', count: approvedCount },
          { tab: 'CHANGES_REQUESTED', label: 'Changes Requested', count: changesCount },
          { tab: 'REJECTED', label: 'Rejected', count: architects.filter((a) => a.accountStatus === 'REJECTED').length },
          { tab: 'SUSPENDED', label: 'Suspended', count: architects.filter((a) => a.accountStatus === 'SUSPENDED').length },
        ].map((t) => (
          <button
            key={t.tab}
            onClick={() => setSelectedStatusTab(t.tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedStatusTab === t.tab
                ? 'bg-sky-600 text-white shadow-xs'
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

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Architect Name, ID (BG/QUO/0001), Firm Name, COA No, Mobile, or City..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white shadow-2xs"
        />
      </div>

      {/* ---------------- ARCHITECTS TABLE ---------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Architect & ID</th>
                <th className="py-3 px-4">COA License No</th>
                <th className="py-3 px-4">Review & Tier</th>
                <th className="py-3 px-4">Special Discount</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions (Review • Notes • Discount • Send)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No architect applications found matching current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((arch) => {
                  const isApproved = arch.accountStatus === 'APPROVED';
                  const isPending = arch.accountStatus === 'PENDING_APPROVAL';
                  const isChanges = arch.accountStatus === 'CHANGES_REQUESTED';
                  const isSuspended = arch.accountStatus === 'SUSPENDED';
                  const hasDiscount = arch.specialDiscount?.enabled;
                  const review = arch.adminReview;
                  const notesCount = arch.internalNotes?.length || 0;
                  const sharesCount = arch.customerShares?.length || 0;

                  return (
                    <tr key={arch.id} className="hover:bg-sky-50/40 transition">
                      {/* Name & Firm & ID */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => {
                            setSelectedArchitect(arch);
                            setActiveDossierTab('CREDENTIALS');
                          }}
                          className="flex items-center gap-3 cursor-pointer group"
                          title="Click to view dossier"
                        >
                          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                            {arch.profilePhoto ? (
                              <img src={arch.profilePhoto} alt={arch.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              arch.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-navy-950 group-hover:text-sky-600 transition-colors truncate flex items-center gap-1.5">
                              <span>{arch.name}</span>
                              {review?.tierBadge === 'MASTER_ARCHITECT' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase">
                                  Master
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 group-hover:text-slate-700 truncate">
                              {arch.firmName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-mono text-slate-400">Ph: +91 {arch.phone}</span>
                              <span className="px-1.5 py-0.2 rounded bg-sky-50 border border-sky-200 text-sky-800 font-mono text-[10px] font-bold">
                                {arch.id}
                              </span>
                              {notesCount > 0 && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenNotes(arch);
                                  }}
                                  className="px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[10px] inline-flex items-center gap-1 hover:bg-blue-100"
                                  title="View internal admin notes"
                                >
                                  <StickyNote className="w-2.5 h-2.5 text-blue-600" />
                                  <span>{notesCount}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* COA License */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                        {arch.coaNumber || 'Under Review'}
                      </td>

                      {/* Review & Tier */}
                      <td className="py-3.5 px-4">
                        {review ? (
                          <div
                            onClick={() => handleOpenReview(arch)}
                            className="cursor-pointer group/rev"
                            title="Click to update Governance Review"
                          >
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span className="text-slate-900 font-black">{review.rating.toFixed(1)}</span>
                              <span className="text-[10px] text-slate-400">/ 5.0</span>
                            </div>
                            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                              Score: {review.qualityScore || 95}% • {review.tierBadge?.replace('_', ' ') || 'VERIFIED'}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenReview(arch)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 border border-dashed border-slate-300 text-[10px] font-bold text-slate-600 transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3 h-3 text-amber-500" />
                            <span>Add Review</span>
                          </button>
                        )}
                      </td>

                      {/* Special Discount */}
                      <td className="py-3.5 px-4">
                        {hasDiscount ? (
                          <div
                            onClick={() => handleOpenDiscount(arch)}
                            className="cursor-pointer group/disc inline-block"
                            title="Click to edit special discount"
                          >
                            <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[11px] inline-flex items-center gap-1 group-hover/disc:bg-amber-100 transition shadow-2xs">
                              <Tag className="w-3 h-3 text-amber-600" />
                              <span>
                                {arch.specialDiscount?.type === 'PERCENTAGE'
                                  ? `${arch.specialDiscount.amount}% OFF`
                                  : `₹${arch.specialDiscount?.amount} OFF`}
                              </span>
                              <span className="font-mono text-[10px] bg-amber-200/70 px-1 py-0.2 rounded">
                                {arch.specialDiscount?.code}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenDiscount(arch)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-dashed border-slate-300 text-[10px] font-bold text-slate-600 transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Percent className="w-3 h-3 text-emerald-600" />
                            <span>Set Discount</span>
                          </button>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{arch.city}</div>
                        <div className="text-[10px] text-slate-400">{arch.state}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : isChanges
                              ? 'bg-sky-100 text-sky-900 border border-sky-300'
                              : isSuspended
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {arch.accountStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Send to Customer Button */}
                          <button
                            onClick={() => handleOpenSend(arch)}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Recommend & send this architect to a registered customer"
                          >
                            <SendHorizontal className="w-3.5 h-3.5" />
                            <span>Send</span>
                            {sharesCount > 0 && (
                              <span className="px-1 py-0.2 rounded-full bg-white/20 text-white text-[9px] font-mono">
                                {sharesCount}
                              </span>
                            )}
                          </button>

                          {/* Quick Notes Button */}
                          <button
                            onClick={() => handleOpenNotes(arch)}
                            className="p-1.5 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition cursor-pointer"
                            title="Admin Internal Notes"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Discount Button */}
                          <button
                            onClick={() => handleOpenDiscount(arch)}
                            className="p-1.5 rounded-xl text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 hover:border-amber-300 transition cursor-pointer"
                            title="Special Discount Offer"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Review Button */}
                          <button
                            onClick={() => handleOpenReview(arch)}
                            className="p-1.5 rounded-xl text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 hover:border-amber-300 transition cursor-pointer"
                            title="Governance Review & Rating"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                          </button>

                          {/* View Dossier Button */}
                          <button
                            onClick={() => {
                              setSelectedArchitect(arch);
                              setActiveDossierTab('CREDENTIALS');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                            title="Open full architect dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Dossier</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Permanently delete architect "${arch.name || arch.firmName}"?`)) {
                                deleteArchitectAccount(arch.id);
                                loadData();
                                success(`Architect "${arch.name || arch.firmName}" deleted.`);
                              }
                            }}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Delete Architect Record"
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

      {/* ---------------- APPLICATION INSPECTION MODAL / DRAWER (FULL DOSSIER) ---------------- */}
      <AnimatePresence>
        {selectedArchitect && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            
            {/* Modal Header */}
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedArchitect(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Architects Table</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {selectedArchitect.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/30">
                      ID: {selectedArchitect.id}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                      {selectedArchitect.accountStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {selectedArchitect.firmName} • {selectedArchitect.city} • COA: {selectedArchitect.coaNumber || 'COA Verified'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => handleOpenSend(selectedArchitect)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send to Customer</span>
                </button>
                <button
                  onClick={() => setSelectedArchitect(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Dossier Tabs: Credentials, Review, Notes, Special Discount, Send to Customer */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2 sticky top-[57px] z-30 flex items-center gap-2 overflow-x-auto shadow-2xs">
              {[
                { id: 'CREDENTIALS', label: '1. Full Credentials & KYC (6 Steps)', icon: FileCheck2 },
                { id: 'REVIEW', label: '2. Governance Review & Rating', icon: Star, badge: selectedArchitect.adminReview?.rating ? `${selectedArchitect.adminReview.rating}★` : null },
                { id: 'NOTES', label: '3. Internal Admin Notes', icon: StickyNote, badge: (selectedArchitect.internalNotes?.length || 0) > 0 ? String(selectedArchitect.internalNotes?.length) : null },
                { id: 'DISCOUNT', label: '4. Special Discount Offer', icon: Tag, badge: selectedArchitect.specialDiscount?.enabled ? 'Active' : null },
                { id: 'SEND_CUSTOMER', label: '5. Send to Customer', icon: SendHorizontal, badge: (selectedArchitect.customerShares?.length || 0) > 0 ? `${selectedArchitect.customerShares?.length} Sent` : null },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDossierTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDossierTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                        isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dossier Body Content */}
            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              
              {/* ---------------- TAB 1: CREDENTIALS (6 SECTIONS) ---------------- */}
              {activeDossierTab === 'CREDENTIALS' && (
                <div className="space-y-6">
                  {/* 1. Personal & Contact */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="font-bold text-navy-950 flex items-center gap-2 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      <User className="w-4 h-4 text-sky-600" />
                      <span>Step 1: Principal Architect Personal Details</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                      <div>Name: <strong className="text-navy-950 block">{selectedArchitect.name}</strong></div>
                      <div>Phone: <strong className="text-navy-950 font-mono block">+91 {selectedArchitect.phone}</strong></div>
                      <div>Email: <strong className="text-navy-950 block">{selectedArchitect.email || 'Not provided'}</strong></div>
                      <div>Designation: <strong className="text-navy-950 block">{selectedArchitect.designation}</strong></div>
                      <div>Experience: <strong className="text-navy-950 block">{selectedArchitect.experienceYears} Years</strong></div>
                      <div>Location: <strong className="text-navy-950 block">{selectedArchitect.city}, {selectedArchitect.state}</strong></div>
                    </div>
                    {selectedArchitect.bio && (
                      <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-relaxed">
                        <strong>Bio:</strong> {selectedArchitect.bio}
                      </p>
                    )}
                  </div>

                  {/* 2. Firm & Statutory */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="font-bold text-navy-950 flex items-center gap-2 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      <span>Step 2: Practice & Statutory Credentials</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                      <div>Firm Name: <strong className="text-navy-950 block">{selectedArchitect.firmName}</strong></div>
                      <div>Business Type: <strong className="text-navy-950 block">{selectedArchitect.businessType}</strong></div>
                      <div>COA Registration No: <strong className="text-sky-700 font-mono font-bold block">{selectedArchitect.coaNumber || 'Under Review'}</strong></div>
                      <div>PAN Number: <strong className="text-navy-950 font-mono block">{selectedArchitect.panNumber || 'Not Specified'}</strong></div>
                      <div>GSTIN: <strong className="text-navy-950 font-mono block">{selectedArchitect.gstin || 'Unregistered / Composition'}</strong></div>
                      <div>Team Size: <strong className="text-navy-950 block">{selectedArchitect.teamSize} Staff ({selectedArchitect.architectsCount} Architects)</strong></div>
                    </div>
                  </div>

                  {/* 3. 21 Architectural Services */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                    <div className="font-bold text-navy-950 flex items-center justify-between text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-600" />
                        <span>Step 3: Professional Services Configured</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                        {selectedArchitect.services?.length || 0} Specializations Selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedArchitect.services?.map((svc, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-medium flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{svc}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 4. Portfolio Projects */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                    <div className="font-bold text-navy-950 flex items-center justify-between text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-sky-600" />
                        <span>Step 4: Executed Practice Portfolio</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                        {selectedArchitect.portfolioProjects?.length || 0} Showcase Projects
                      </span>
                    </div>
                    {selectedArchitect.portfolioProjects && selectedArchitect.portfolioProjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedArchitect.portfolioProjects.map((p, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                            {p.imageUrl && (
                              <img src={p.imageUrl} alt={p.title} className="w-full h-32 object-cover rounded-lg mb-2" />
                            )}
                            <div className="font-bold text-navy-950">{p.title}</div>
                            <div className="text-[11px] text-slate-500">{p.category} • {p.location}</div>
                            <div className="text-[10px] text-slate-400">Built-up: {p.builtUpArea} • Completed: {p.completionYear}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No portfolio projects uploaded during registration.</p>
                    )}
                  </div>

                  {/* 5. KYC Documents */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                    <div className="font-bold text-navy-950 flex items-center justify-between text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-sky-600" />
                        <span>Step 5: KYC Verification Documents</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {selectedArchitect.documents?.length || 0} Documents Uploaded
                      </span>
                    </div>
                    {selectedArchitect.documents && selectedArchitect.documents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedArchitect.documents.map((doc, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-navy-950">{doc.title}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{doc.documentType} • {doc.fileSize || 'PDF Document'}</div>
                            </div>
                            {doc.fileUrl && doc.fileUrl !== '#' ? (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold inline-flex items-center gap-1 transition"
                              >
                                <span>Inspect</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Pending file</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No KYC documents attached.</p>
                    )}
                  </div>

                  {/* 6. Bank Details & Cheque */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="font-bold text-navy-950 flex items-center justify-between text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-700" />
                        <span>Step 6: Bank Account & Cheque Acceptance</span>
                      </div>
                      {selectedArchitect.bankDetails?.isChequeAccepted && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Cheque Accepted
                        </span>
                      )}
                    </div>
                    {selectedArchitect.bankDetails?.accountNumber ? (
                      <div className="space-y-2 text-slate-700 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          <div>Bank Name: <strong className="text-navy-950 block">{selectedArchitect.bankDetails.bankName || 'Not specified'}</strong></div>
                          <div>Account Holder: <strong className="text-navy-950 block">{selectedArchitect.bankDetails.accountHolderName || selectedArchitect.name}</strong></div>
                          <div>Account Number: <strong className="text-navy-950 font-mono block">•••• {selectedArchitect.bankDetails.accountNumber.slice(-4)}</strong></div>
                          <div>IFSC Code: <strong className="text-navy-950 font-mono block">{selectedArchitect.bankDetails.ifscCode}</strong></div>
                          <div>Account Type: <strong className="text-navy-950 block">{selectedArchitect.bankDetails.accountType || 'CURRENT'}</strong></div>
                          <div>Branch / City: <strong className="text-navy-950 block">{selectedArchitect.bankDetails.branch || selectedArchitect.city || 'Main Branch'}</strong></div>
                        </div>
                        <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                          <div className="text-[11px] text-slate-600">
                            Cheque File: <strong className="text-navy-950">{selectedArchitect.bankDetails.cancelledChequeFileName || 'Attached Cheque'}</strong>
                          </div>
                          {selectedArchitect.bankDetails.cancelledChequeUrl && selectedArchitect.bankDetails.cancelledChequeUrl !== '#' ? (
                            <a
                              href={selectedArchitect.bankDetails.cancelledChequeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition inline-flex items-center gap-1 shadow-2xs"
                            >
                              <span>View Cheque</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No cheque file attached</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-1">
                        Bank details not provided during registration.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------- TAB 2: GOVERNANCE REVIEW & RATING ---------------- */}
              {activeDossierTab === 'REVIEW' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-md space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span>Governance Desk Audit & Quality Review</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set professional review ratings, execution quality scores, and certification badges displayed to homeowners.
                      </p>
                    </div>
                    {selectedArchitect.adminReview?.reviewedAt && (
                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        Last Reviewed: {new Date(selectedArchitect.adminReview.reviewedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Rating Slider & Stars */}
                    <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Overall Architect Rating:
                        </label>
                        <div className="flex items-center gap-1 font-mono text-lg font-black text-amber-600">
                          <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                          <span>{reviewForm.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className={`p-2 rounded-xl border text-base font-bold transition flex items-center justify-center flex-1 cursor-pointer ${
                              reviewForm.rating >= star
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-400 border-slate-200 hover:bg-amber-50'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${reviewForm.rating >= star ? 'fill-white' : ''}`} />
                            <span className="ml-1 text-xs">{star}</span>
                          </button>
                        ))}
                      </div>

                      {/* Tier Badge Selection */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Professional Classification Tier:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['STANDARD', 'VERIFIED_ELITE', 'MASTER_ARCHITECT'] as const).map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, tierBadge: tier })}
                              className={`p-2.5 rounded-xl border text-[11px] font-black transition cursor-pointer text-center ${
                                reviewForm.tierBadge === tier
                                  ? 'bg-navy-950 text-white border-navy-950 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {tier.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Dimension Ratings */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Quality Execution Score:</span>
                        <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {reviewForm.qualityScore}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={reviewForm.qualityScore}
                        onChange={(e) => setReviewForm({ ...reviewForm, qualityScore: Number(e.target.value) })}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />

                      <div className="space-y-3 pt-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Design & Planning Aesthetics:</span>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                onClick={() => setReviewForm({ ...reviewForm, designAestheticsRating: s })}
                                className={`w-3.5 h-3.5 cursor-pointer ${
                                  reviewForm.designAestheticsRating >= s ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">IS-Code Structural Engineering:</span>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                onClick={() => setReviewForm({ ...reviewForm, structuralAccuracyRating: s })}
                                className={`w-3.5 h-3.5 cursor-pointer ${
                                  reviewForm.structuralAccuracyRating >= s ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Customer Communication:</span>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                onClick={() => setReviewForm({ ...reviewForm, communicationRating: s })}
                                className={`w-3.5 h-3.5 cursor-pointer ${
                                  reviewForm.communicationRating >= s ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Text Area */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Public Quality Audit Summary & Endorsement:
                    </label>
                    <textarea
                      rows={3}
                      value={reviewForm.summary}
                      onChange={(e) => setReviewForm({ ...reviewForm, summary: e.target.value })}
                      placeholder="Enter quality evaluation remarks visible on the platform profile..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveReview(selectedArchitect.id)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Governance Review</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- TAB 3: INTERNAL ADMIN NOTES ---------------- */}
              {activeDossierTab === 'NOTES' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-md space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                      <StickyNote className="w-5 h-5 text-blue-600" />
                      <span>Internal Operations & Governance Notes</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Confidential audit trail, site meeting notes, and compliance flags visible exclusively to Platform Administrators.
                    </p>
                  </div>

                  {/* Add New Note Box */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">Add Confidential Note</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Priority:</span>
                        {(['NORMAL', 'HIGH', 'URGENT'] as const).map((pr) => (
                          <button
                            key={pr}
                            type="button"
                            onClick={() => setNotePriority(pr)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              notePriority === pr
                                ? pr === 'URGENT'
                                  ? 'bg-rose-600 text-white'
                                  : pr === 'HIGH'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {pr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Type internal note (e.g. 'Site visit conducted on 14 Nov; verified 3 active luxury villa projects in Sector 48. Recommended for high-value clients')..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAddNote(selectedArchitect.id)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Note to Dossier</span>
                      </button>
                    </div>
                  </div>

                  {/* Saved Notes Chronological List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Recorded Internal Notes ({selectedArchitect.internalNotes?.length || 0})
                    </h4>

                    {selectedArchitect.internalNotes && selectedArchitect.internalNotes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedArchitect.internalNotes.map((n) => (
                          <div
                            key={n.id}
                            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 text-xs"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-navy-950">{n.author || 'Super Admin Desk'}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(n.createdAt).toLocaleString()}
                                </span>
                                {n.priority && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                      n.priority === 'URGENT'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : n.priority === 'HIGH'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {n.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{n.text}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteNote(selectedArchitect.id, n.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No internal notes recorded yet for this architect.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------- TAB 4: SPECIAL DISCOUNT ---------------- */}
              {activeDossierTab === 'DISCOUNT' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-md space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-amber-500" />
                        <span>Special Platform Discount Configuration</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure promotional voucher codes and exclusive discounts attached when dispatching this architect to homeowners.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">Discount Enabled:</span>
                      <input
                        type="checkbox"
                        checked={discountForm.enabled}
                        onChange={(e) => setDiscountForm({ ...discountForm, enabled: e.target.checked })}
                        className="w-5 h-5 accent-emerald-600 cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Discount Settings Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                          <select
                            value={discountForm.type}
                            onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="PERCENTAGE">Percentage (% Off)</option>
                            <option value="FLAT">Flat Amount (₹ Off)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {discountForm.type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Flat Amount (₹)'}
                          </label>
                          <input
                            type="number"
                            value={discountForm.amount}
                            onChange={(e) => setDiscountForm({ ...discountForm, amount: Number(e.target.value) })}
                            min="1"
                            max={discountForm.type === 'PERCENTAGE' ? 50 : 100000}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Coupon / Promo Code</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={discountForm.code}
                              onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                              placeholder="e.g. BGARCH10"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:border-amber-500 font-mono text-amber-700"
                            />
                            <button
                              type="button"
                              onClick={() => setDiscountForm({ ...discountForm, code: `BGARCH${selectedArchitect.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}${discountForm.amount}` })}
                              className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700"
                              title="Generate code from name"
                            >
                              Auto
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Valid Until</label>
                          <input
                            type="date"
                            value={discountForm.validUntil}
                            onChange={(e) => setDiscountForm({ ...discountForm, validUntil: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Discount Scope & Terms</label>
                        <textarea
                          rows={2}
                          value={discountForm.terms}
                          onChange={(e) => setDiscountForm({ ...discountForm, terms: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Live Voucher Preview Card */}
                    <div className="flex flex-col justify-center">
                      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono bg-white/20 px-2 py-0.5 rounded-full">
                            BuildGhar Exclusive Voucher
                          </span>
                          <Gift className="w-5 h-5 text-amber-200" />
                        </div>
                        <div className="text-3xl font-black font-display">
                          {discountForm.type === 'PERCENTAGE' ? `${discountForm.amount}% OFF` : `₹${discountForm.amount} OFF`}
                        </div>
                        <div className="text-xs text-amber-100 font-medium">
                          Valid for architectural blueprints & 3D elevations by <strong>{selectedArchitect.name}</strong>.
                        </div>
                        <div className="pt-2 border-t border-white/20 flex items-center justify-between font-mono text-xs">
                          <span className="font-black bg-white text-amber-800 px-2.5 py-1 rounded-lg">
                            {discountForm.code || 'BGARCH10'}
                          </span>
                          <span className="text-[10px] text-amber-200">Expires: {discountForm.validUntil}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveDiscount(selectedArchitect.id)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Special Discount Offer</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- TAB 5: SEND TO CUSTOMER ---------------- */}
              {activeDossierTab === 'SEND_CUSTOMER' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-md space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                      <SendHorizontal className="w-5 h-5 text-emerald-600" />
                      <span>Dispatch Architect Recommendation to Customer</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Directly share this architect’s credentials, portfolio, and an exclusive discount coupon with any registered homeowner via WhatsApp and In-App Portal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Selection & Channel */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Select Registered Customer: <span className="text-rose-500">*</span>
                        </label>
                        {customers.length > 0 ? (
                          <select
                            value={sendForm.selectedCustomerId}
                            onChange={(e) => setSendForm({ ...sendForm, selectedCustomerId: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">-- Choose Homeowner --</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.phone}) • {c.city}, {c.state} [{c.id}]
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800 border border-amber-200">
                            No registered customers found. Homeowners will automatically appear here when they register or submit RFQs.
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Attached Coupon Code</label>
                          <input
                            type="text"
                            value={sendForm.discountCode}
                            onChange={(e) => setSendForm({ ...sendForm, discountCode: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-amber-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Discount Tag</label>
                          <input
                            type="text"
                            value={sendForm.discountApplied}
                            onChange={(e) => setSendForm({ ...sendForm, discountApplied: e.target.value })}
                            placeholder="e.g. 10% OFF"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Channel</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { ch: 'ALL', label: 'WhatsApp + Portal' },
                            { ch: 'WHATSAPP', label: 'WhatsApp Only' },
                            { ch: 'PORTAL', label: 'Portal Only' },
                          ].map((c) => (
                            <button
                              key={c.ch}
                              type="button"
                              onClick={() => setSendForm({ ...sendForm, channel: c.ch as any })}
                              className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                                sendForm.channel === c.ch
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Recommendation Message Note</label>
                        <textarea
                          rows={3}
                          value={sendForm.customNote}
                          onChange={(e) => setSendForm({ ...sendForm, customNote: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Live WhatsApp / In-App Message Preview */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Message Preview Dispatched to Homeowner:
                      </span>
                      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs font-mono text-slate-800 space-y-2 whitespace-pre-wrap leading-relaxed shadow-2xs">
                        🏛️ <strong>BuildGhar Professional Architect Recommendation</strong>
                        <br />
                        Hello <strong>{customers.find((c) => c.id === sendForm.selectedCustomerId)?.name || '[Customer Name]'}</strong>,
                        <br />
                        Our Central Architecture & Engineering Governance Desk recommends licensed Architect <strong>{selectedArchitect.name}</strong> ({selectedArchitect.firmName}, COA Lic: <strong>{selectedArchitect.coaNumber || 'Verified'}</strong>) for your architectural planning & design in <strong>{selectedArchitect.city}</strong>.
                        <br />
                        🎁 <strong>Special Platform Voucher:</strong> Use code <strong>{sendForm.discountCode}</strong> for <strong>{sendForm.discountApplied}</strong> off on your project drawings!
                        <br />
                        📝 <strong>Governance Desk Note:</strong>
                        <br />
                        &quot;{sendForm.customNote}&quot;
                        <br />
                        👉 https://ghar-design.vercel.app/professionals
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handleDispatchToCustomer(selectedArchitect)}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                        >
                          <SendHorizontal className="w-4 h-4" />
                          <span>Dispatch Recommendation Now</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Previous Customer Dispatches Log */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Previous Homeowner Recommendations ({selectedArchitect.customerShares?.length || 0})
                    </h4>
                    {selectedArchitect.customerShares && selectedArchitect.customerShares.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedArchitect.customerShares.map((s) => (
                          <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="font-bold text-navy-950">{s.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{s.customerPhone}</div>
                            <div className="text-[10px] text-emerald-700 font-bold">
                              {s.discountApplied} • Code: {s.discountCode}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Sent: {new Date(s.sentAt).toLocaleDateString()} via {s.channel}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">This architect has not been dispatched to any customer yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer: Core Status Lifecycle Actions */}
              <div className="p-6 border-t border-slate-200 bg-white rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSuspendToggle(selectedArchitect.id, selectedArchitect.accountStatus)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    {selectedArchitect.accountStatus === 'SUSPENDED' ? 'Reinstate Partner' : 'Suspend Account'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete "${selectedArchitect.name || selectedArchitect.firmName}"?`)) {
                        deleteArchitectAccount(selectedArchitect.id);
                        setSelectedArchitect(null);
                        loadData();
                        success('Architect record deleted.');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition flex items-center gap-1.5 cursor-pointer"
                    title="Permanently delete this architect from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
                    onClick={() => handleOpenRemarksModal('CHANGES_REQUESTED')}
                    className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold transition"
                  >
                    Request Changes
                  </button>

                  <button
                    onClick={() => handleApprove(selectedArchitect.id)}
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

      {/* ---------------- STANDALONE QUICK REVIEW MODAL ---------------- */}
      {quickReviewArch && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Review & Rating: {quickReviewArch.name}</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{quickReviewArch.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickReviewArch(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="font-bold text-slate-800">Overall Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                      className={`w-5 h-5 cursor-pointer ${
                        reviewForm.rating >= s ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Summary:</label>
                <textarea
                  rows={3}
                  value={reviewForm.summary}
                  onChange={(e) => setReviewForm({ ...reviewForm, summary: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickReviewArch(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveReview(quickReviewArch.id)}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STANDALONE QUICK NOTES MODAL ---------------- */}
      {quickNotesArch && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-blue-600" />
                  <span>Internal Notes: {quickNotesArch.name}</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{quickNotesArch.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickNotesArch(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Add New Note:</span>
                  <div className="flex items-center gap-1">
                    {(['NORMAL', 'HIGH', 'URGENT'] as const).map((pr) => (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => setNotePriority(pr)}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          notePriority === pr ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type confidential note..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddNote(quickNotesArch.id)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </div>

              {/* Existing Notes */}
              <div className="max-h-48 overflow-y-auto space-y-2 pt-2 border-t border-slate-100 text-xs">
                {quickNotesArch.internalNotes && quickNotesArch.internalNotes.length > 0 ? (
                  quickNotesArch.internalNotes.map((n) => (
                    <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono">{new Date(n.createdAt).toLocaleDateString()}</div>
                        <p className="text-slate-800 mt-0.5">{n.text}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(quickNotesArch.id, n.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center italic py-2">No notes yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickNotesArch(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STANDALONE QUICK DISCOUNT MODAL ---------------- */}
      {quickDiscountArch && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>Special Discount: {quickDiscountArch.name}</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{quickDiscountArch.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickDiscountArch(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={discountForm.amount}
                    onChange={(e) => setDiscountForm({ ...discountForm, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-amber-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickDiscountArch(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveDiscount(quickDiscountArch.id)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs"
              >
                Save Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STANDALONE QUICK SEND TO CUSTOMER MODAL ---------------- */}
      {quickSendArch && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                  <SendHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Send Architect to Customer</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {quickSendArch.name} • {quickSendArch.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuickSendArch(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Registered Customer:</label>
                <select
                  value={sendForm.selectedCustomerId}
                  onChange={(e) => setSendForm({ ...sendForm, selectedCustomerId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="">-- Choose Homeowner --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) • {c.city} [{c.id}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={sendForm.discountCode}
                    onChange={(e) => setSendForm({ ...sendForm, discountCode: e.target.value.toUpperCase() })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Tag</label>
                  <input
                    type="text"
                    value={sendForm.discountApplied}
                    onChange={(e) => setSendForm({ ...sendForm, discountApplied: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recommendation Note</label>
                <textarea
                  rows={2}
                  value={sendForm.customNote}
                  onChange={(e) => setSendForm({ ...sendForm, customNote: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ALL', 'WHATSAPP', 'PORTAL'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSendForm({ ...sendForm, channel: ch })}
                      className={`p-1.5 rounded-lg font-bold transition text-center ${
                        sendForm.channel === ch ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickSendArch(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDispatchToCustomer(quickSendArch)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Dispatch Recommendation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- REMARKS / FEEDBACK FULL-SCREEN VIEW ---------------- */}
      {showRemarksModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-60 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowRemarksModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Architects Network</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                  {pendingAction === 'CHANGES_REQUESTED' ? 'Request Profile Modifications' : 'Reject Architect Application'}
                </h2>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  Compliance Feedback & Audit Desk • {selectedArchitect?.name || 'Architect'}
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
                  Official Compliance Feedback & Audit Reason for {selectedArchitect?.name}: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  placeholder="Specify exact modifications needed (e.g. illegible COA registration certificate, mismatched GST/PAN, or site visit requirement)."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
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
                    pendingAction === 'CHANGES_REQUESTED'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {pendingAction === 'CHANGES_REQUESTED' ? 'Send Modification Request' : 'Confirm Application Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
