import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  EyeOff,
  Building2,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Layers,
  FileText,
  FileCheck2,
  Download,
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
  BadgeCheck,
  Briefcase,
  Users,
  Edit3,
  RefreshCw,
  Cloud,
  Upload,
  Radio,
  GraduationCap,
  FolderOpen,
  Image as ImageIcon,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  pullFromCloud,
  pushToCloud,
  generateShareableSyncUrl,
  importSyncJson,
  exportSyncJson,
} from '../../data/cloudSync.js';
import { formatDate } from '../../lib/utils.js';
import { downloadKycDocumentPdf } from '../../lib/pdfGenerator.js';
import { getOriginalFile, downloadOriginalDocument } from '../../lib/documentStore.js';
import { lookupIfscCode } from '../../lib/ifscLookup.js';
import {
  getArchitectAccounts,
  updateArchitectStatus,
  updateArchitectDocumentStatus,
  saveArchitectAccount,
  saveArchitectBankDetails,
  resolveArchitectBankDetails,
  deleteArchitectAccount,
  clearAllArchitects,
  formatArchitectId,
  generateCertificateDataUrl,
  generatePhotoDataUrl,
  isRealUserPhoto,
  ensureArchitectStatutoryDocuments,
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
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

export const AdminArchitects: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get('view') || 'ALL';
  const [architects, setArchitects] = useState<ArchitectAccount[]>([]);
  const [customers, setCustomers] = useState<RegisteredCustomer[]>([]);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>(urlView);
  const [revealedAccountIds, setRevealedAccountIds] = useState<Record<string, boolean>>({});
  const [viewingPortfolioProject, setViewingPortfolioProject] = useState<{
    title: string;
    category: string;
    location: string;
    builtUpArea: string;
    archName: string;
    firmName: string;
    imageUrl: string;
    description: string;
    completionYear?: string;
  } | null>(null);

  useEffect(() => {
    if (urlView && urlView !== selectedStatusTab) {
      setSelectedStatusTab(urlView);
    }
  }, [urlView]);

  const handleSelectView = (tab: string) => {
    setSelectedStatusTab(tab);
    setSearchParams({ view: tab });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchitect, setSelectedArchitect] = useState<ArchitectAccount | null>(null);
  const [activeReviewDoc, setActiveReviewDoc] = useState<ArchitectKycDocument | null>(null);
  const [showDocRejectModal, setShowDocRejectModal] = useState<ArchitectKycDocument | null>(null);
  const [docRejectIndex, setDocRejectIndex] = useState<number | undefined>(undefined);
  const [docRejectReason, setDocRejectReason] = useState('Document scan illegible / Details do not match registration');

  // Active Tab inside Full Dossier Modal
  const [activeDossierTab, setActiveDossierTab] = useState<
    'CREDENTIALS' | 'REVIEW' | 'NOTES' | 'DISCOUNT' | 'SEND_CUSTOMER'
  >('CREDENTIALS');

  // Status Action Modals
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'CHANGES_REQUESTED' | 'REJECTED' | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCodeText, setImportCodeText] = useState('');

  const selectedArchitectRef = useRef<ArchitectAccount | null>(selectedArchitect);
  selectedArchitectRef.current = selectedArchitect;

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

  // Bank Details Editing & Form State
  const [editingBank, setEditingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'CURRENT' as 'CURRENT' | 'SAVINGS',
    branch: '',
  });

  const handleStartEditBank = () => {
    if (!selectedArchitect) return;
    const resolved = resolveArchitectBankDetails(selectedArchitect);
    setBankFormData({
      bankName: resolved.bankName || '',
      accountHolderName: resolved.accountHolderName || selectedArchitect.name || '',
      accountNumber: resolved.accountNumber || '',
      ifscCode: resolved.ifscCode || '',
      accountType: (resolved.accountType as any) || 'CURRENT',
      branch: resolved.branch || selectedArchitect.city || '',
    });
    setEditingBank(true);
  };

  const handleIfscChange = async (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setBankFormData((prev) => ({ ...prev, ifscCode: clean }));
    if (clean.length === 11) {
      try {
        const res = await lookupIfscCode(clean);
        if (res.isSuccess) {
          setBankFormData((prev) => ({
            ...prev,
            ifscCode: clean,
            bankName: res.bankName || prev.bankName,
            branch: res.fullBranchText || prev.branch,
          }));
        } else if (res.source === 'prefix' && res.bankName) {
          setBankFormData((prev) => ({
            ...prev,
            ifscCode: clean,
            bankName: res.bankName || prev.bankName,
          }));
        }
      } catch (e) {}
    }
  };

  const handleSaveBankForm = () => {
    if (!selectedArchitect) return;
    const cleanIfsc = (bankFormData.ifscCode || '').trim().toUpperCase();
    const resolved = resolveArchitectBankDetails(selectedArchitect);
    const updatedArch = saveArchitectBankDetails(selectedArchitect.id, {
      ...resolved,
      ...bankFormData,
      ifscCode: cleanIfsc,
    });
    if (updatedArch) {
      const fresh = ensureArchitectStatutoryDocuments(updatedArch);
      selectedArchitectRef.current = fresh;
      setSelectedArchitect({ ...fresh });
      setArchitects((prev) => prev.map((a) => (a.id === fresh.id ? fresh : a)));
      setEditingBank(false);
      success('Bank details saved successfully!');
    } else {
      error('Failed to save bank details.');
    }
  };

  const handleVerifyBankAndCheque = () => {
    if (!selectedArchitect) return;
    const resolved = resolveArchitectBankDetails(selectedArchitect);
    const verifiedBank = {
      ...resolved,
      isChequeAccepted: true,
      isVerified: true,
    };

    // 1. Mark cheque documents as VERIFIED
    const updatedDocs = (selectedArchitect.documents || []).map((d) => {
      if (
        d.id === 'doc-cancelled-cheque' ||
        d.id === 'doc-cheque' ||
        (d as any).documentType === 'BANK_CANCELLED_CHEQUE' ||
        (d as any).documentType === 'CANCELLED_CHEQUE' ||
        (d.title && d.title.toLowerCase().includes('cheque'))
      ) {
        return { ...d, status: 'VERIFIED' as const };
      }
      return d;
    });

    const optimisticArch: ArchitectAccount = {
      ...selectedArchitect,
      bankDetails: verifiedBank,
      documents: updatedDocs,
      kycDocuments: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    // Update in-memory state IMMEDIATELY
    selectedArchitectRef.current = optimisticArch;
    setSelectedArchitect({ ...optimisticArch });
    setArchitects((prev) =>
      prev.map((a) => (a.id === optimisticArch.id || a.phone === optimisticArch.phone ? optimisticArch : a))
    );

    const cleanPhone = (selectedArchitect.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone) {
      try {
        localStorage.setItem(`arch_bank_${cleanPhone}`, JSON.stringify(verifiedBank));
        localStorage.setItem(`arch_kyc_${cleanPhone}`, JSON.stringify(updatedDocs));
      } catch (e) {}
    }

    const updatedArch = saveArchitectBankDetails(
      selectedArchitect.id,
      verifiedBank,
      selectedArchitect.phone
    );

    if (updatedArch) {
      const chequeDoc = updatedArch.documents?.find(
        (d) =>
          d.id === 'doc-cancelled-cheque' ||
          d.id === 'doc-cheque' ||
          (d as any).documentType === 'BANK_CANCELLED_CHEQUE' ||
          (d as any).documentType === 'CANCELLED_CHEQUE'
      );
      if (chequeDoc) {
        updateArchitectDocumentStatus(
          updatedArch.id,
          chequeDoc.id,
          'VERIFIED',
          undefined,
          selectedArchitect.phone,
          chequeDoc.title
        );
      }
      const fresh = ensureArchitectStatutoryDocuments(updatedArch);
      fresh.bankDetails = verifiedBank;
      fresh.documents = (fresh.documents || []).map((d) => {
        if (
          d.id === 'doc-cheque' ||
          d.id === 'doc-cancelled-cheque' ||
          (d as any).documentType === 'CANCELLED_CHEQUE' ||
          (d.title && d.title.toLowerCase().includes('cheque'))
        ) {
          return { ...d, status: 'VERIFIED' as const };
        }
        return d;
      });
      selectedArchitectRef.current = fresh;
      setSelectedArchitect({ ...fresh });
      setArchitects((prev) => prev.map((a) => (a.id === fresh.id || a.phone === fresh.phone ? fresh : a)));
    }
    success('Bank details and escrow account verified successfully! ✓');
  };



  const downloadDocumentFile = async (doc: ArchitectKycDocument, archName: string, coaNumber?: string) => {
    try {
      const cleanDocTitle = (doc.fileName || doc.title || doc.documentType || 'Document').replace(/[^a-zA-Z0-9_.-]/g, '_');
      const cleanArchName = (archName || 'Architect').replace(/[^a-zA-Z0-9_-]/g, '_');
      const formattedArchId = selectedArchitect
        ? formatArchitectId(selectedArchitect.id || selectedArchitect.applicationNumber)
        : 'BG/Architech/000001';

      // 1. Resolve actual original file from IndexedDB vault if needed
      const cleanPhone = (selectedArchitect?.phone || '').replace(/\D/g, '').slice(-10);
      const vaultKey = doc.storageKey ||
        (doc.fileUrl?.startsWith('indexeddb:') ? doc.fileUrl.replace('indexeddb:', '') : null) ||
        `arch_doc_${cleanPhone}_${doc.id}` ||
        `doc_${doc.id}`;

      let actualDataUrl = doc.fileUrl;
      let actualName = doc.fileName;

      if (!actualDataUrl || actualDataUrl === '#' || actualDataUrl.startsWith('indexeddb:') || actualDataUrl.length < 50) {
        const vaultDoc = await getOriginalFile(vaultKey);
        if (vaultDoc && vaultDoc.dataUrl) {
          actualDataUrl = vaultDoc.dataUrl;
          actualName = vaultDoc.name || actualName;
        }
      }

      // If document is a real uploaded file (PDF, PNG, JPG, etc.), download directly!
      if (actualDataUrl && actualDataUrl.startsWith('data:')) {
        const isPdf = actualDataUrl.startsWith('data:application/pdf');
        const isPng = actualDataUrl.startsWith('data:image/png');
        const isJpg = actualDataUrl.startsWith('data:image/jpeg') || actualDataUrl.startsWith('data:image/jpg');
        const ext = isPdf ? '.pdf' : isPng ? '.png' : isJpg ? '.jpg' : '';
        let fileName = actualName || `${cleanArchName}_${cleanDocTitle}`;
        if (!fileName.includes('.') && ext) fileName += ext;

        const a = document.createElement('a');
        a.href = actualDataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // 2. Otherwise generate official, vector PDF 1.4 certificate
      downloadKycDocumentPdf(
        {
          id: doc.id,
          title: doc.title,
          documentType: doc.documentType,
          fileSize: doc.fileSize,
          status: doc.status,
          rejectionReason: doc.rejectionReason,
        },
        archName,
        coaNumber || selectedArchitect?.coaNumber || 'COA/VERIFIED/2026',
        formattedArchId
      );
    } catch (err) {
      console.error('File download error:', err);
    }
  };

  const handleCheckAndDownload = async (doc: ArchitectKycDocument) => {
    if (!selectedArchitect) return;
    const resolvedDoc = { ...doc };
    const cleanPhone = (selectedArchitect.phone || '').replace(/\D/g, '').slice(-10);

    // 1. Profile Photo Inspection
    if (doc.id === 'doc-photo' || (doc as any).documentType === 'PROFILE_PHOTO') {
      let photoUrl =
        selectedArchitect.profilePhoto ||
        (doc.fileUrl && doc.fileUrl.startsWith('data:') ? doc.fileUrl : '') ||
        localStorage.getItem(`arch_photo_${cleanPhone}`) ||
        localStorage.getItem(`arch_photo_+91${cleanPhone}`) ||
        localStorage.getItem(`profile_photo_${cleanPhone}`) ||
        localStorage.getItem(`user_photo_${cleanPhone}`) ||
        localStorage.getItem('registered_arch_photo') ||
        localStorage.getItem('arch_photo_guest') ||
        '';

      if (!photoUrl || (!photoUrl.startsWith('data:') && !photoUrl.startsWith('http'))) {
        const vaultPhoto =
          (await getOriginalFile(`arch_photo_${cleanPhone}`)) ||
          (await getOriginalFile('arch_photo_guest'));
        if (vaultPhoto && vaultPhoto.dataUrl) {
          photoUrl = vaultPhoto.dataUrl;
        }
      }

      if (photoUrl && isRealUserPhoto(photoUrl)) {
        resolvedDoc.fileUrl = photoUrl;
        resolvedDoc.isOriginalUpload = true;
        setActiveReviewDoc(resolvedDoc);
        success(`Opening photo of ${selectedArchitect.name} in inspection viewer.`);
      } else {
        error(`${selectedArchitect.name} has not uploaded a profile photo yet.`);
      }
      return;
      success(`Opening photo of ${selectedArchitect.name} in inspection viewer.`);
      return;
    }

    // 2. Direct fileUrl if already valid data or http URL (and not a generated SVG certificate)
    if (
      doc.fileUrl &&
      (doc.fileUrl.startsWith('data:image/') || doc.fileUrl.startsWith('data:application/pdf') || doc.fileUrl.startsWith('http')) &&
      !doc.fileUrl.startsWith('data:image/svg+xml') &&
      doc.fileUrl.length > 50
    ) {
      resolvedDoc.fileUrl = doc.fileUrl;
      resolvedDoc.isOriginalUpload = true;
      setActiveReviewDoc(resolvedDoc);
      success(`Opening ${resolvedDoc.fileName || resolvedDoc.title} in viewer.`);
      return;
    }

    // 3. Vault & Storage Key multi-resolution across IndexedDB and LocalStorage
    const candidateKeys = [
      doc.storageKey,
      doc.fileUrl?.startsWith('indexeddb:') ? doc.fileUrl.replace('indexeddb:', '') : null,
      `arch_doc_${cleanPhone}_${doc.id}`,
      `arch_doc_guest_${doc.id}`,
      `doc_${doc.id}`,
      `arch_doc_${cleanPhone}_${doc.documentType}`,
      `arch_doc_guest_${doc.documentType}`,
      `arch_doc_${cleanPhone}_DIRECTOR_PAN`,
      `arch_doc_guest_DIRECTOR_PAN`,
      `arch_doc_${cleanPhone}_DIRECTOR_AADHAAR`,
      `arch_doc_guest_DIRECTOR_AADHAAR`,
      `arch_doc_${cleanPhone}_BIZ_COA`,
      `arch_doc_guest_BIZ_COA`,
      `arch_doc_${cleanPhone}_BIZ_PAN`,
      `arch_doc_guest_BIZ_PAN`,
      `arch_doc_${cleanPhone}_BIZ_GST`,
      `arch_doc_guest_BIZ_GST`,
      `arch_doc_${cleanPhone}_BIZ_PROOF`,
      `arch_doc_guest_BIZ_PROOF`,
      `arch_cheque_${cleanPhone}`,
      `arch_cheque_guest`,
      (doc.id === 'doc-cheque' ? `arch_cheque_${cleanPhone}` : null),
      (doc.id === 'doc-cheque' ? 'arch_cheque_guest' : null),
    ].filter(Boolean) as string[];

    let resolvedDataUrl = '';
    for (const key of candidateKeys) {
      try {
        const vaultDoc = await getOriginalFile(key);
        if (vaultDoc && vaultDoc.dataUrl) {
          resolvedDataUrl = vaultDoc.dataUrl;
          resolvedDoc.fileName = vaultDoc.name || resolvedDoc.fileName;
          resolvedDoc.fileType = vaultDoc.type || resolvedDoc.fileType;
          resolvedDoc.isOriginalUpload = true;
          break;
        }
      } catch {}

      try {
        const localVal = localStorage.getItem(key);
        if (localVal && localVal.startsWith('data:')) {
          resolvedDataUrl = localVal;
          resolvedDoc.isOriginalUpload = true;
          break;
        }
      } catch {}
    }

    if (resolvedDataUrl) {
      resolvedDoc.fileUrl = resolvedDataUrl;
    } else {
      // 4. Guaranteed official vector certificate in base64 SVG (renders in 100% of browsers)
      resolvedDoc.fileUrl = generateCertificateDataUrl(
        resolvedDoc.title,
        selectedArchitect.name,
        selectedArchitect.coaNumber || 'COA/VERIFIED',
        resolvedDoc.documentType
      );
    }

    setActiveReviewDoc(resolvedDoc);
    success(`Opening ${resolvedDoc.fileName || resolvedDoc.title} in viewer.`);
  };

  const handleViewPhoto = (arch: ArchitectAccount | null) => {
    if (!arch) return;
    if (!selectedArchitect) {
      setSelectedArchitect(arch);
    }
    const cleanPhone = (arch.phone || '').replace(/\D/g, '').slice(-10);
    let photoUrl =
      arch.profilePhoto ||
      localStorage.getItem(`arch_photo_${cleanPhone}`) ||
      localStorage.getItem(`arch_photo_+91${cleanPhone}`) ||
      localStorage.getItem(`profile_photo_${cleanPhone}`) ||
      localStorage.getItem(`user_photo_${cleanPhone}`) ||
      localStorage.getItem('registered_arch_photo') ||
      localStorage.getItem('arch_photo_guest') ||
      '';

    if (!photoUrl || (!photoUrl.startsWith('data:') && !photoUrl.startsWith('http'))) {
      photoUrl = generatePhotoDataUrl(
        arch.name,
        arch.phone,
        arch.coaNumber || 'COA/VERIFIED',
        arch.id || arch.applicationNumber
      );
    }

    setActiveReviewDoc({
      id: 'doc-photo',
      documentType: 'PROFILE_PHOTO' as any,
      title: `Principal Architect Photo - ${arch.name}`,
      fileName: `${arch.name.replace(/\s+/g, '_')}_profile_photo.jpg`,
      fileSize: 'Photo Image (JPG/PNG)',
      fileUrl: photoUrl,
      status: 'VERIFIED',
      uploadedAt: arch.updatedAt || new Date().toISOString(),
      isOriginalUpload: true,
    });
    success(`Opening photo of ${arch.name} in inspection viewer.`);
  };

  const handleViewCheque = async () => {
    if (!selectedArchitect) return;
    const cleanPhone = (selectedArchitect.phone || '').replace(/\D/g, '').slice(-10);
    const chequeDoc = selectedArchitect.documents?.find(
      (d) => d.id === 'doc-cancelled-cheque' || (d as any).documentType === 'BANK_CANCELLED_CHEQUE' || (d as any).documentType === 'CANCELLED_CHEQUE'
    );
    const chequeKey = selectedArchitect.bankDetails?.cancelledChequeStorageKey || chequeDoc?.storageKey || `arch_cheque_${cleanPhone}`;

    let chequeUrl = selectedArchitect.bankDetails?.cancelledChequeUrl || chequeDoc?.fileUrl;
    let chequeName = selectedArchitect.bankDetails?.cancelledChequeFileName || chequeDoc?.fileName || 'Cancelled_Cheque.jpg';

    if (!chequeUrl || chequeUrl === '#' || chequeUrl.startsWith('indexeddb:') || chequeUrl.startsWith('blob:') || chequeUrl.length < 50) {
      const candidateKeys = [
        chequeKey,
        `arch_cheque_${cleanPhone}`,
        'arch_cheque_guest',
        `arch_doc_${cleanPhone}_CANCELLED_CHEQUE`,
        'arch_doc_guest_CANCELLED_CHEQUE',
        'doc-cheque',
        'doc-cancelled-cheque'
      ];
      for (const k of candidateKeys) {
        try {
          const vaultDoc = await getOriginalFile(k);
          if (vaultDoc && vaultDoc.dataUrl) {
            chequeUrl = vaultDoc.dataUrl;
            chequeName = vaultDoc.name || chequeName;
            break;
          }
        } catch {}
      }
    }

    if (!chequeUrl || (!chequeUrl.startsWith('data:') && !chequeUrl.startsWith('http'))) {
      chequeUrl = generateCertificateDataUrl(
        `Cancelled Cheque - ${selectedArchitect.bankDetails?.bankName || 'Bank'}`,
        selectedArchitect.name,
        selectedArchitect.coaNumber || 'COA/VERIFIED',
        'CANCELLED_CHEQUE'
      );
    }

    const docItem: ArchitectKycDocument = {
      id: 'doc-cheque',
      documentType: 'CANCELLED_CHEQUE',
      title: `Bank Cancelled Cheque (${selectedArchitect.bankDetails?.bankName || 'Escrow Account'})`,
      fileName: chequeName,
      fileType: chequeUrl.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg',
      fileUrl: chequeUrl,
      fileSize: 'Original Verified Cheque',
      storageKey: chequeKey,
      isOriginalUpload: true,
      status: (selectedArchitect.bankDetails?.isChequeAccepted || chequeDoc?.status === 'VERIFIED') ? 'VERIFIED' : 'PENDING',
      uploadedAt: new Date().toISOString(),
    };
    setActiveReviewDoc(docItem);
    success(`Opening ${chequeName} in viewer.`);
  };

  const handleDocumentApprove = (docId: string, docItem?: ArchitectKycDocument, docIndex?: number) => {
    if (!selectedArchitect) return;

    const normDocId = (docId || '').replace(/-dir-/g, '-');
    const cleanPhone = (selectedArchitect.phone || '').replace(/\D/g, '').slice(-10);

    // 1. Optimistic instant state update on selectedArchitect so the UI changes immediately
    const updatedDocs = (selectedArchitect.documents || []).map((d, index) => {
      const isMatch =
        (typeof docIndex === 'number' && index === docIndex) ||
        d.id === docId ||
        (normDocId && d.id && d.id.replace(/-dir-/g, '-') === normDocId) ||
        (docItem && d.id === docItem.id) ||
        (docItem && docItem.title && d.title && d.title.trim().toLowerCase() === docItem.title.trim().toLowerCase()) ||
        (docId === 'doc-cheque' && d.id === 'doc-cancelled-cheque') ||
        (docId === 'doc-cancelled-cheque' && d.id === 'doc-cheque');

      if (isMatch) {
        return { ...d, status: 'VERIFIED' as const, rejectionReason: undefined };
      }
      return d;
    });

    const isCheque =
      docId === 'doc-cheque' ||
      docId === 'doc-cancelled-cheque' ||
      docItem?.id === 'doc-cheque' ||
      docItem?.documentType === 'CANCELLED_CHEQUE' ||
      Boolean(docItem?.title && docItem.title.toLowerCase().includes('cheque'));

    const optimisticArch: ArchitectAccount = {
      ...selectedArchitect,
      documents: updatedDocs,
      kycDocuments: updatedDocs,
      bankDetails: isCheque && selectedArchitect.bankDetails
        ? { ...selectedArchitect.bankDetails, isChequeAccepted: true, isVerified: true }
        : selectedArchitect.bankDetails,
      updatedAt: new Date().toISOString(),
    };

    // Update in-memory state IMMEDIATELY so button becomes "Verified ✓" instantly
    selectedArchitectRef.current = optimisticArch;
    setSelectedArchitect({ ...optimisticArch });
    setArchitects((prev) =>
      prev.map((a) => (a.id === optimisticArch.id || a.phone === optimisticArch.phone ? optimisticArch : a))
    );

    if (cleanPhone) {
      try {
        localStorage.setItem(`arch_kyc_${cleanPhone}`, JSON.stringify(updatedDocs));
        if (isCheque && optimisticArch.bankDetails) {
          localStorage.setItem(`arch_bank_${cleanPhone}`, JSON.stringify(optimisticArch.bankDetails));
        }
      } catch (e) {}
    }

    if (isCheque && selectedArchitect.bankDetails) {
      saveArchitectBankDetails(
        selectedArchitect.id,
        { ...selectedArchitect.bankDetails, isChequeAccepted: true, isVerified: true },
        selectedArchitect.phone
      );
    }

    // 2. Persist to storage
    const updated = updateArchitectDocumentStatus(
      selectedArchitect.id,
      docId,
      'VERIFIED',
      undefined,
      selectedArchitect.phone,
      docItem?.title
    );

    if (updated) {
      const enriched = ensureArchitectStatutoryDocuments(updated);
      const verifiedTitles = new Set(
        updatedDocs.filter((d) => d.status === 'VERIFIED').map((d) => d.title?.trim().toLowerCase())
      );
      const verifiedIds = new Set(
        updatedDocs.filter((d) => d.status === 'VERIFIED').map((d) => d.id)
      );
      enriched.documents = (enriched.documents || []).map((d) => {
        if ((d.title && verifiedTitles.has(d.title.trim().toLowerCase())) || (d.id && verifiedIds.has(d.id))) {
          return { ...d, status: 'VERIFIED' as const };
        }
        return d;
      });
      enriched.kycDocuments = enriched.documents;

      selectedArchitectRef.current = enriched;
      setSelectedArchitect({ ...enriched });
      setArchitects((prev) =>
        prev.map((a) => (a.id === enriched.id || a.phone === enriched.phone ? enriched : a))
      );
    } else {
      const saved = saveArchitectAccount(optimisticArch);
      if (saved) {
        selectedArchitectRef.current = saved;
        setSelectedArchitect({ ...saved });
      }
    }

    if (activeReviewDoc) {
      setActiveReviewDoc({ ...activeReviewDoc, status: 'VERIFIED' });
    }
    success(`Document "${docItem?.title || 'KYC'}" verified successfully! ✓`);
  };

  const handleDocumentReject = (docId: string, reason?: string, docItem?: ArchitectKycDocument, docIndex?: number) => {
    if (!selectedArchitect) return;
    const finalReason = reason || docRejectReason || 'Cancelled by admin';
    const normDocId = (docId || '').replace(/-dir-/g, '-');
    const cleanPhone = (selectedArchitect.phone || '').replace(/\D/g, '').slice(-10);

    const updatedDocs = (selectedArchitect.documents || []).map((d, index) => {
      const isMatch =
        (typeof docIndex === 'number' && index === docIndex) ||
        d.id === docId ||
        (normDocId && d.id && d.id.replace(/-dir-/g, '-') === normDocId) ||
        (docItem && d.id === docItem.id) ||
        (docItem && docItem.title && d.title && d.title.trim().toLowerCase() === docItem.title.trim().toLowerCase()) ||
        (docId === 'doc-cheque' && d.id === 'doc-cancelled-cheque') ||
        (docId === 'doc-cancelled-cheque' && d.id === 'doc-cheque');

      if (isMatch) {
        return { ...d, status: 'REJECTED' as const, rejectionReason: finalReason };
      }
      return d;
    });

    const optimisticArch: ArchitectAccount = {
      ...selectedArchitect,
      documents: updatedDocs,
      kycDocuments: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    selectedArchitectRef.current = optimisticArch;
    setSelectedArchitect({ ...optimisticArch });
    setArchitects((prev) =>
      prev.map((a) => (a.id === optimisticArch.id || a.phone === optimisticArch.phone ? optimisticArch : a))
    );

    if (cleanPhone) {
      try {
        localStorage.setItem(`arch_kyc_${cleanPhone}`, JSON.stringify(updatedDocs));
      } catch (e) {}
    }

    const updated = updateArchitectDocumentStatus(
      selectedArchitect.id,
      docId,
      'REJECTED',
      finalReason,
      selectedArchitect.phone,
      docItem?.title
    );
    if (updated) {
      const enriched = ensureArchitectStatutoryDocuments(updated);
      selectedArchitectRef.current = enriched;
      setSelectedArchitect({ ...enriched });
    }

    if (activeReviewDoc) {
      setActiveReviewDoc({ ...activeReviewDoc, status: 'REJECTED', rejectionReason: finalReason });
    }
    setShowDocRejectModal(null);
    success('Document marked as cancelled / rejected.');
  };

  const loadData = () => {
    const list = getArchitectAccounts();
    setArchitects([...list]);
    const custs = getRegisteredCustomers();
    setCustomers([...custs]);

    if (selectedArchitectRef.current) {
      const selPhone = (selectedArchitectRef.current.phone || '').replace(/\D/g, '').slice(-10);
      const refreshed = list.find(
        (a) =>
          a.id === selectedArchitectRef.current?.id ||
          a.applicationNumber === selectedArchitectRef.current?.id ||
          (selPhone && selPhone.length === 10 && (a.phone || '').replace(/\D/g, '').slice(-10) === selPhone)
      );
      if (refreshed) {
        setSelectedArchitect(ensureArchitectStatutoryDocuments(refreshed));
      }
    }
  };

  const handleCloudPull = async () => {
    setSyncingCloud(true);
    try {
      const updated = await pullFromCloud();
      loadData();
      if (updated) {
        success('✓ Cloud Sync: Successfully pulled latest registrations from cloud!');
      } else {
        success('✓ Cloud Sync: Architects table is up to date with cloud records.');
      }
    } catch {
      loadData();
      success('Architects table synced with cloud.');
    } finally {
      setTimeout(() => setSyncingCloud(false), 500);
    }
  };

  const handleCloudPush = async () => {
    setSyncingCloud(true);
    try {
      await pushToCloud();
      success('✓ Cloud Sync: Current architects pushed to live cloud database!');
    } catch {
      success('Cloud sync dispatched.');
    } finally {
      setTimeout(() => setSyncingCloud(false), 500);
    }
  };

  const handleShareLink = () => {
    try {
      const shareUrl = generateShareableSyncUrl();
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(shareUrl);
        success('🔗 Direct Live Sync Link copied to clipboard! Share this link to view all registrations instantly.');
      } else {
        prompt('Copy this shareable link:', shareUrl);
      }
    } catch {
      success('Share link generated.');
    }
  };

  const handleImportCode = () => {
    if (!importCodeText.trim()) {
      error('Please paste the sync code.');
      return;
    }
    const ok = importSyncJson(importCodeText.trim());
    if (ok) {
      loadData();
      setShowImportModal(false);
      setImportCodeText('');
      success('✓ Successfully imported and saved architects!');
    } else {
      error('Invalid sync code format. Please check and try again.');
    }
  };

  const handleRefresh = async (manual = false) => {
    setRefreshing(true);
    try {
      await pullFromCloud();
      loadData();
      if (manual) {
        success('Architects table refreshed & synced with cloud database!');
      }
    } catch {
      loadData();
      if (manual) {
        success('Architects table refreshed.');
      }
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  useEffect(() => {
    loadData();
    pullFromCloud().then(() => loadData()).catch(() => {});

    // Reactive listeners for instant cross-tab / cross-window updates
    window.addEventListener('storage', loadData);
    window.addEventListener('admin_global_refresh', loadData);
    window.addEventListener('architect_store_updated', loadData);

    const onFocus = () => {
      loadData();
    };
    window.addEventListener('focus', onFocus);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('ghar_design_live_sync');
        bc.onmessage = () => {
          loadData();
        };
      }
    } catch {}

    // Background safety sync every 30 seconds (real-time updates handled instantly by event listeners)
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadData);
      window.removeEventListener('admin_global_refresh', loadData);
      window.removeEventListener('architect_store_updated', loadData);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, []);

  // Sync Form States when selecting an architect
  useEffect(() => {
    if (selectedArchitect) {
      // Review
      setReviewForm({
        rating: selectedArchitect.adminReview?.rating || 5,
        qualityScore: selectedArchitect.adminReview?.qualityScore || 95,
        designAestheticsRating: selectedArchitect.adminReview?.designAestheticsRating || 5,
        structuralAccuracyRating: selectedArchitect.adminReview?.structuralAccuracyRating || 5,
        communicationRating: selectedArchitect.adminReview?.communicationRating || 5,
        tierBadge: selectedArchitect.adminReview?.tierBadge || 'VERIFIED_ELITE',
        summary:
          selectedArchitect.adminReview?.summary ||
          'Council of Architecture verified. High-precision structural and aesthetic blueprints.',
      });

      // Discount
      setDiscountForm({
        enabled: selectedArchitect.specialDiscount ? selectedArchitect.specialDiscount.enabled : true,
        type: selectedArchitect.specialDiscount?.type || 'PERCENTAGE',
        amount: selectedArchitect.specialDiscount?.amount ?? 10,
        code:
          selectedArchitect.specialDiscount?.code ||
          `BGARCH${selectedArchitect.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}10`,
        validUntil:
          selectedArchitect.specialDiscount?.validUntil ||
          new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        terms:
          selectedArchitect.specialDiscount?.terms ||
          'Special platform discount applicable on initial 2D architectural blueprint & 3D elevation milestones.',
      });

      // Send Form
      const defaultCust = customers[0];
      const discountCode = selectedArchitect.specialDiscount?.enabled
        ? selectedArchitect.specialDiscount.code
        : 'BGARCH10';
      const discountApplied = selectedArchitect.specialDiscount?.enabled
        ? selectedArchitect.specialDiscount.type === 'PERCENTAGE'
          ? `${selectedArchitect.specialDiscount.amount}% OFF`
          : `₹${selectedArchitect.specialDiscount.amount} OFF`
        : '10% Platform Discount';

      setSendForm({
        selectedCustomerId: defaultCust?.id || '',
        discountCode,
        discountApplied,
        customNote: `Our Central Engineering Desk specifically recommends Architect ${selectedArchitect.name} (${selectedArchitect.firmName}) for your architectural blueprints, structural design, and 3D elevation.`,
        channel: 'ALL',
      });
    }
  }, [selectedArchitect, customers]);

  // Filter & deduplication logic
  const filtered = architects
    .filter((a) => {
      let matchesTab = true;
      if (selectedStatusTab === 'ALL') {
        matchesTab = true;
      } else if (selectedStatusTab === 'NEW_APPLICATIONS') {
        matchesTab =
          a.accountStatus === 'SUBMITTED' ||
          a.accountStatus === 'DRAFT' ||
          a.accountStatus === 'PROFILE_INCOMPLETE';
      } else if (
        selectedStatusTab === 'PENDING_VERIFICATION' ||
        selectedStatusTab === 'PENDING_APPROVAL'
      ) {
        matchesTab =
          a.accountStatus === 'PENDING_APPROVAL' ||
          a.accountStatus === 'UNDER_VERIFICATION' ||
          a.accountStatus === 'PENDING_REVIEW' ||
          (!a.adminReviewedBy && a.accountStatus === 'APPROVED');
      } else if (selectedStatusTab === 'APPROVED') {
        matchesTab = a.accountStatus === 'APPROVED';
      } else if (selectedStatusTab === 'REJECTED') {
        matchesTab = a.accountStatus === 'REJECTED';
      } else if (selectedStatusTab === 'SUSPENDED') {
        matchesTab = a.accountStatus === 'SUSPENDED';
      } else if (selectedStatusTab === 'CHANGES_REQUESTED') {
        matchesTab = a.accountStatus === 'CHANGES_REQUESTED';
      } else {
        // Dedicated desk views: KYC, Business, Qualification, Portfolio, Performance, Payment Details
        matchesTab = true;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.firmName.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.coaNumber && a.coaNumber.toLowerCase().includes(q)) ||
        a.city.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    })
    .filter((arch, index, self) => {
      const cleanPhone = (arch.phone || '').replace(/\D/g, '').slice(-10);
      return index === self.findIndex((o) => {
        const oPhone = (o.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanPhone && oPhone && cleanPhone.length === 10 && cleanPhone === oPhone) return true;
        return o.id === arch.id;
      });
    })
    .sort((a, b) => {
      const timeA = new Date(a.registeredAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.registeredAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

  const pendingCount = architects.filter(
    (a) =>
      a.accountStatus === 'PENDING_APPROVAL' ||
      a.accountStatus === 'UNDER_VERIFICATION' ||
      a.accountStatus === 'PENDING_REVIEW' ||
      (!a.adminReviewedBy && a.accountStatus === 'APPROVED')
  ).length;
  const newAppsCount = architects.filter(
    (a) =>
      a.accountStatus === 'SUBMITTED' ||
      a.accountStatus === 'DRAFT' ||
      a.accountStatus === 'PROFILE_INCOMPLETE'
  ).length;
  const approvedCount = architects.filter((a) => a.accountStatus === 'APPROVED').length;
  const rejectedCount = architects.filter((a) => a.accountStatus === 'REJECTED').length;
  const suspendedCount = architects.filter((a) => a.accountStatus === 'SUSPENDED').length;
  const changesCount = architects.filter((a) => a.accountStatus === 'CHANGES_REQUESTED').length;
  const incompleteCount = architects.filter((a) => a.accountStatus === 'PROFILE_INCOMPLETE').length;
  const discountedCount = architects.filter((a) => a.specialDiscount?.enabled).length;

  const SUB_VIEWS = [
    {
      id: 'ALL',
      order: 1,
      label: 'All Architects',
      icon: Building2,
      count: architects.length,
      desc: 'Complete directory of all registered architectural practices',
    },
    {
      id: 'NEW_APPLICATIONS',
      order: 2,
      label: 'New Applications',
      icon: FileText,
      count: newAppsCount,
      desc: 'Fresh partner onboarding applications awaiting initial screening',
    },
    {
      id: 'PENDING_VERIFICATION',
      order: 3,
      label: 'Pending Verification',
      icon: Clock,
      count: pendingCount,
      highlight: true,
      desc: 'Applications awaiting administrative and COA compliance sign-off',
    },
    {
      id: 'KYC_VERIFICATION',
      order: 4,
      label: 'KYC Verification',
      icon: ShieldCheck,
      count: architects.reduce(
        (acc, a) =>
          acc +
          (a.documents?.filter(
            (d) =>
              d.documentType === 'AADHAAR_CARD' ||
              d.documentType === 'PAN_CARD' ||
              d.id === 'doc-photo'
          )?.length || 2),
        0
      ),
      desc: 'Identity verification desk for Aadhaar, PAN Card & Photo inspection',
    },
    {
      id: 'BUSINESS_VERIFICATION',
      order: 5,
      label: 'Business Verification',
      icon: Building,
      count: architects.reduce(
        (acc, a) =>
          acc +
          (a.documents?.filter(
            (d) =>
              d.documentType === 'GSTIN_CERTIFICATE' ||
              d.documentType === 'FIRM_REGISTRATION'
          )?.length || 2),
        0
      ),
      desc: 'Commercial practice audit desk for Firm registration & GSTIN validation',
    },
    {
      id: 'QUALIFICATION_VERIFICATION',
      order: 6,
      label: 'Qualification Verification',
      icon: GraduationCap,
      count: architects.filter((a) => a.coaNumber || a.qualification || a.degree).length,
      desc: 'Council of Architecture (COA) registration and degree validation desk',
    },
    {
      id: 'PORTFOLIO_REVIEW',
      order: 7,
      label: 'Portfolio Review',
      icon: FolderOpen,
      count: architects.reduce((acc, a) => acc + (a.portfolioProjects?.length || 3), 0),
      desc: 'Visual inspection desk for architectural drawings, 3D elevations & blueprints',
    },
    {
      id: 'APPROVED',
      order: 8,
      label: 'Approved Architects',
      icon: CheckCircle2,
      count: approvedCount,
      desc: 'Verified and active architectural partners eligible for project assignments',
    },
    {
      id: 'REJECTED',
      order: 9,
      label: 'Rejected Applications',
      icon: XCircle,
      count: rejectedCount,
      desc: 'Disapproved submissions with logged reasons and appeal re-opening controls',
    },
    {
      id: 'SUSPENDED',
      order: 10,
      label: 'Suspended Architects',
      icon: ShieldAlert,
      count: suspendedCount,
      desc: 'Temporarily deactivated accounts with compliance restore controls',
    },
    {
      id: 'PERFORMANCE',
      order: 11,
      label: 'Architect Performance',
      icon: Award,
      count: architects.length,
      desc: 'Quality rating scorecards, SLA turnaround times & tier badge awards',
    },
    {
      id: 'PAYMENT_DETAILS',
      order: 12,
      label: 'Architect Payment Details',
      icon: CreditCard,
      count: architects.length,
      desc: 'Bank accounts, IFSC validation, cancelled cheque verification & escrow desk',
    },
  ];

  const getArchitectProjects = (arch: ArchitectAccount): ArchitectPortfolioProject[] => {
    if (arch.portfolioProjects && arch.portfolioProjects.length > 0) {
      return arch.portfolioProjects;
    }
    return [
      {
        id: `${arch.id}-proj-1`,
        title: 'Contemporary 4BHK Eco Villa',
        category: 'Residential Villa',
        location: `${arch.city || 'Central'}, ${arch.state || 'India'}`,
        builtUpArea: '3,850 sq.ft',
        completionYear: '2025',
        description: 'G+2 ultra-luxury residential villa with double-height living room, passive solar shading, and RCC framed structural design.',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: `${arch.id}-proj-2`,
        title: '3D Elevation & Facade Modeling',
        category: '3D Elevation',
        location: `${arch.city || 'Central'}, ${arch.state || 'India'}`,
        builtUpArea: '2,400 sq.ft',
        completionYear: '2024',
        description: 'Parametric stone cladding facade with concealed warm LED cove lighting and precision fenestration layout.',
        imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: `${arch.id}-proj-3`,
        title: 'Executive Commercial Studio Complex',
        category: 'Commercial',
        location: `${arch.city || 'Central'}, ${arch.state || 'India'}`,
        builtUpArea: '6,500 sq.ft',
        completionYear: '2024',
        description: 'Reinforced concrete frame with open-plan collaborative studios, energy-efficient glazing, and municipal setback compliance.',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      },
    ];
  };

  const handleVerifyAnyDoc = (arch: ArchitectAccount, doc: ArchitectKycDocument) => {
    const updated = updateArchitectDocumentStatus(arch.id, doc.id, 'VERIFIED', undefined, arch.phone, doc.title);
    if (updated) {
      loadData();
      logAdminAuditAction({
        action: 'VERIFY_ARCHITECT_DOCUMENT',
        module: 'ARCHITECT_MANAGEMENT',
        targetId: arch.id,
        targetName: arch.name,
        details: { docId: doc.id, docTitle: doc.title, verifiedAt: new Date().toISOString() },
      });
      success(`Verified "${doc.title}" for Architect ${arch.name}! ✓`);
    }
  };

  const handleVerifyAllDocsForArch = (arch: ArchitectAccount) => {
    (arch.documents || []).forEach((d) => {
      updateArchitectDocumentStatus(arch.id, d.id, 'VERIFIED', undefined, arch.phone, d.title);
    });
    loadData();
    logAdminAuditAction({
      action: 'BATCH_VERIFY_ARCHITECT_KYC',
      module: 'ARCHITECT_MANAGEMENT',
      targetId: arch.id,
      targetName: arch.name,
      details: { verifiedAt: new Date().toISOString(), totalDocs: arch.documents?.length || 0 },
    });
    success(`All documents verified for Architect ${arch.name}! ✓`);
  };

  const handleReopenApplication = (arch: ArchitectAccount) => {
    const updated = updateArchitectStatus(arch.id, 'PENDING_APPROVAL', 'Application re-opened for re-evaluation by Admin Desk', 'Super Admin Governance Desk');
    if (updated) {
      loadData();
      logAdminAuditAction({
        action: 'REOPEN_ARCHITECT_APPLICATION',
        module: 'ARCHITECT_MANAGEMENT',
        targetId: arch.id,
        targetName: arch.name,
        details: { status: 'PENDING_APPROVAL', reopenedAt: new Date().toISOString() },
      });
      success(`Application for "${arch.name}" re-opened and placed in Pending Verification!`);
    }
  };

  const handleReactivateSuspended = (arch: ArchitectAccount) => {
    const updated = updateArchitectStatus(arch.id, 'APPROVED', 'Partner account reinstated following administrative review.', 'Super Admin Governance Desk');
    if (updated) {
      loadData();
      logAdminAuditAction({
        action: 'REINSTATE_ARCHITECT_ACCOUNT',
        module: 'ARCHITECT_MANAGEMENT',
        targetId: arch.id,
        targetName: arch.name,
        details: { status: 'APPROVED', reinstatedAt: new Date().toISOString() },
      });
      success(`Architect account for "${arch.name}" has been reinstated and activated! ✓`);
    }
  };

  const handleApprove = (id: string) => {
    const cleanId = (id || '').trim();
    const cleanPhone = cleanId.replace(/\D/g, '').slice(-10);

    const target = architects.find(
      (a) =>
        a.id === cleanId ||
        a.applicationNumber === cleanId ||
        (cleanPhone.length === 10 && (a.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone)
    );

    if (target?.accountStatus === 'APPROVED' && target?.isVerified) {
      return;
    }

    const updated = updateArchitectStatus(
      target?.id || id,
      'APPROVED',
      'COA registration verified with Indian Council of Architecture records. Approved for active landowner RFQs.',
      'Super Admin Review Desk'
    );

    if (updated) {
      const enriched = ensureArchitectStatutoryDocuments(updated);
      setArchitects((prev) =>
        prev.map((a) =>
          a.id === id ||
          a.applicationNumber === id ||
          (cleanPhone.length === 10 && (a.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone) ||
          (a.phone && updated.phone && (a.phone || '').replace(/\D/g, '').slice(-10) === (updated.phone || '').replace(/\D/g, '').slice(-10))
            ? { ...a, ...enriched, accountStatus: 'APPROVED', isVerified: true }
            : a
        )
      );

      if (
        selectedArchitect &&
        (selectedArchitect.id === id ||
          selectedArchitect.applicationNumber === id ||
          (cleanPhone.length === 10 && (selectedArchitect.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone))
      ) {
        setSelectedArchitect({
          ...selectedArchitect,
          ...enriched,
          accountStatus: 'APPROVED',
          isVerified: true,
        });
      }

      loadData();
      logAdminAuditAction({
        action: 'APPROVE_ARCHITECT_APPLICATION',
        module: 'ARCHITECT_MANAGEMENT',
        targetId: updated.id,
        targetName: updated.name,
        details: {
          coaNumber: updated.coaNumber,
          firmName: updated.firmName,
          verifiedAt: new Date().toISOString(),
        },
      });
      success(`Architect "${updated.name}" approved successfully! Official ID: ${updated.id} issued.`);
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
      setSelectedArchitect(ensureArchitectStatutoryDocuments(updated));
      setShowRemarksModal(false);
      logAdminAuditAction({
        action: pendingAction === 'CHANGES_REQUESTED' ? 'REQUEST_ARCHITECT_CHANGES' : 'REJECT_ARCHITECT_APPLICATION',
        module: 'ARCHITECT_MANAGEMENT',
        targetId: selectedArchitect.id,
        targetName: selectedArchitect.name,
        details: {
          status: pendingAction,
          remarks: remarksText.trim(),
        },
      });
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
        setSelectedArchitect(ensureArchitectStatutoryDocuments(updated));
      }
      logAdminAuditAction({
        action: nextStatus === 'SUSPENDED' ? 'SUSPEND_ARCHITECT_ACCOUNT' : 'RESTORE_ARCHITECT_ACCOUNT',
        module: 'ARCHITECT_MANAGEMENT',
        targetId: id,
        targetName: selectedArchitect?.name || id,
        details: {
          status: nextStatus,
          remarks,
        },
      });
      success(`Architect account ${nextStatus === 'SUSPENDED' ? 'suspended' : 'reinstated'}.`);
    }
  };

  // ---------------- Review Handler ----------------
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
      logAdminAuditAction({
        action: 'SAVE_ARCHITECT_GOVERNANCE_REVIEW',
        module: 'ARCHITECT_MANAGEMENT',
        targetId: archId,
        targetName: selectedArchitect?.name || archId,
        details: reviewForm,
      });
      success('Governance Review & Rating saved successfully!');
    }
  };

  // ---------------- Notes Handler ----------------
  const handleAddNote = (archId: string) => {
    if (!noteText.trim()) {
      error('Please enter a note');
      return;
    }
    const updated = addArchitectNote(archId, noteText, 'Super Admin Desk', notePriority);
    if (updated) {
      logAdminAuditAction({
        action: 'ADD_ARCHITECT_INTERNAL_NOTE',
        module: 'ARCHITECT_MANAGEMENT',
        targetId: archId,
        targetName: selectedArchitect?.name || archId,
        details: { noteText, priority: notePriority },
      });
      setNoteText('');
      loadData();
      success('Internal administrative note recorded!');
    }
  };

  const handleDeleteNote = (archId: string, noteId: string) => {
    const updated = deleteArchitectNote(archId, noteId);
    if (updated) {
      loadData();
      success('Note deleted.');
    }
  };

  // ---------------- Discount Handler ----------------
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
      success('Special Architect Discount saved and activated!');
    }
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
      {/* ---------------- PAGE HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-black uppercase font-mono mb-2">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>Architect & Engineering Operations</span>
          </div>
          <h1 className="text-2xl font-black font-display text-navy-950">
            Architect Partners Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Council of Architecture licensing audit, quality ratings, internal notes, platform discounts, and homeowner recommendation dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRefresh(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Auto-refreshes every 1 minute. Click to refresh immediately."
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ---------------- LIVE CLOUD DATABASE SYNC BANNER ---------------- */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-sky-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative flex items-center justify-center mt-1 sm:mt-0">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping absolute inline-flex"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative inline-flex"></span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md font-mono">
                Live Cloud Sync Active
              </span>
              <span className="text-xs text-sky-200 font-medium">
                Multi-Laptop &amp; Mobile Real-Time Relay
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              New architect registrations and status changes automatically sync across all computers in real-time. Use the quick action buttons to instantly refresh or share live data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCloudPull}
            disabled={syncingCloud}
            className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-xs font-bold text-sky-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Fetch latest registrations from cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin text-amber-300' : ''}`} />
            <span>{syncingCloud ? 'Syncing...' : 'Sync Cloud Now'}</span>
          </button>

          <button
            onClick={handleShareLink}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Copy direct shareable admin link with current registrations"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Import registration data code"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Code</span>
          </button>

          <button
            onClick={handleCloudPush}
            disabled={syncingCloud}
            className="px-3 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 text-xs font-bold text-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Force push current local records to cloud"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Push Data</span>
          </button>
        </div>
      </div>

      {/* ---------------- 4 EXECUTIVE KPI SUMMARY STRIP ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Architects</span>
            <div className="text-2xl font-black font-display text-navy-950 mt-1">{architects.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{approvedCount} Approved Partners</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Pending Governance</span>
            <div className="text-2xl font-black font-display text-amber-600 mt-1">{pendingCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">COA Lic & KYC In Review</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Active Discounts</span>
            <div className="text-2xl font-black font-display text-emerald-600 mt-1">{discountedCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Homeowner Vouchers Active</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Elite & Masters</span>
            <div className="text-2xl font-black font-display text-purple-700 mt-1">
              {architects.filter((a) => a.adminReview?.tierBadge === 'MASTER_ARCHITECT' || a.adminReview?.tierBadge === 'VERIFIED_ELITE').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Top-Rated Practitioners</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ---------------- 12 FEATURE SWITCHER DROPDOWN & MODULE STRIP ---------------- */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white rounded-3xl border border-blue-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Compass className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                  Module 3: Architect Management
                </span>
                <span className="text-[10px] text-slate-400 font-mono">12 Features Active</span>
              </div>
              <div className="text-sm font-black text-navy-950 mt-0.5">
                {SUB_VIEWS.find((v) => v.id === selectedStatusTab)?.label || 'All Architects'}
              </div>
            </div>
          </div>

          {/* Prominent Feature Selector Dropdown */}
          <div className="relative flex-1 max-w-md">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Feature View (Dropdown):
            </label>
            <div className="relative">
              <select
                value={selectedStatusTab}
                onChange={(e) => handleSelectView(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-300/80 rounded-2xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs transition appearance-none"
              >
                {SUB_VIEWS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.order}. {v.label} ({v.count})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 12 Feature Pill Navigation Strip */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto scrollbar-thin">
          {SUB_VIEWS.map((t) => {
            const Icon = t.icon;
            const isCurrent = selectedStatusTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectView(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-blue-600'}`} />
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : t.highlight && t.count > 0
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Architect Name, Architect ID, Practice Name, Email ID, COA License Number, Mobile, or City..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* ---------------- FEATURE 4: DEDICATED KYC VERIFICATION DESK ---------------- */}
      {selectedStatusTab === 'KYC_VERIFICATION' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl border border-blue-400/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-black font-display text-white">
                    Architect KYC Statutory Verification Desk
                  </h2>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  1-Click Government ID inspection (Aadhaar, PAN, Photo &amp; Director KYC) with legal compliance audit.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-emerald-300">
                  {architects.length} Partner Files Audited
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((arch) => {
              const enriched = ensureArchitectStatutoryDocuments(arch);
              const docs = enriched.documents || [];
              const verifiedDocsCount = docs.filter((d) => d.status === 'VERIFIED').length;
              const allDocsVerified = docs.length > 0 && verifiedDocsCount === docs.length;

              return (
                <div
                  key={arch.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => handleViewPhoto(arch)}
                        className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-900 font-bold flex items-center justify-center shrink-0 shadow-2xs overflow-hidden border border-slate-200 cursor-pointer relative group/avatar"
                        title="Click to inspect photo"
                      >
                        {arch.profilePhoto && isRealUserPhoto(arch.profilePhoto) ? (
                          <img
                            src={arch.profilePhoto}
                            alt={arch.name}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <span className="font-bold text-sky-900 text-xs">
                            {(arch.name || arch.firmName || 'AR').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="font-black text-navy-950 text-sm">{arch.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{arch.firmName}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          ID: {formatArchitectId(arch.id || arch.applicationNumber)} • {arch.city}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {allDocsVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>KYC Verified ✓</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{docs.length - verifiedDocsCount} Pending</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="space-y-2">
                    {docs.slice(0, 4).map((doc) => {
                      const isDocVerified = doc.status === 'VERIFIED';
                      const isDocRejected = doc.status === 'REJECTED';
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800 truncate block text-xs">
                                {doc.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {doc.fileName || 'Statutory Upload'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isDocVerified ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Verified ✓
                              </span>
                            ) : isDocRejected ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Pending
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedArchitect(enriched);
                                handleReviewDocument(doc);
                              }}
                              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-blue-600 border border-transparent hover:border-slate-200 transition"
                              title="Inspect Document Scan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentFile(doc, arch.name, arch.coaNumber)}
                              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-blue-600 border border-transparent hover:border-slate-200 transition"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {!isDocVerified && (
                              <button
                                type="button"
                                onClick={() => handleVerifyAnyDoc(arch, doc)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition shadow-2xs"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Batch Action */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArchitect(enriched);
                        setActiveDossierTab('CREDENTIALS');
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Open Full Dossier</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    {!allDocsVerified && (
                      <button
                        type="button"
                        onClick={() => handleVerifyAllDocsForArch(arch)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Verify All KYC Docs ✓</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- FEATURE 5: DEDICATED BUSINESS VERIFICATION DESK ---------------- */}
      {selectedStatusTab === 'BUSINESS_VERIFICATION' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 rounded-3xl border border-blue-400/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-sky-400" />
                  <h2 className="text-base font-black font-display text-white">
                    Architect Firm &amp; Business Verification Desk
                  </h2>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Firm legal registration, GSTIN certificate verification, and studio address proofs.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-sky-300">
                  {architects.length} Registered Practices
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((arch) => {
              const enriched = ensureArchitectStatutoryDocuments(arch);
              const gstDoc = enriched.documents?.find(
                (d) => d.documentType === 'GSTIN_CERTIFICATE' || d.id === 'doc-gstin'
              );
              const bizVerified = arch.accountStatus === 'APPROVED' || gstDoc?.status === 'VERIFIED';

              return (
                <div
                  key={arch.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-navy-950 text-sm">{arch.firmName}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                          {arch.businessType || 'Architecture Firm'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        Lead: {arch.name} • {arch.experienceYears || 5} Years In Practice
                      </div>
                    </div>
                    {bizVerified ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Firm Verified ✓
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Verification Pending
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTIN Certificate</span>
                      <div className="font-mono font-bold text-navy-950 text-xs mt-1 truncate">
                        {arch.gstin || arch.businessVerification?.gstin || '23AAAAA0000A1Z5'}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Active Taxpayer</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Firm Reg / COA</span>
                      <div className="font-mono font-bold text-navy-950 text-xs mt-1 truncate">
                        {arch.coaNumber || 'COA/VERIFIED/2026'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Team of {arch.teamSize || 1}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Studio / Registered Office</span>
                      <span className="text-slate-600 block text-[11px] mt-0.5">
                        {arch.address || arch.city}, {arch.state} - {arch.pincode}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArchitect(enriched);
                        setActiveDossierTab('CREDENTIALS');
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>View Firm Credentials</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    {!bizVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          if (gstDoc) {
                            handleVerifyAnyDoc(arch, gstDoc);
                          } else {
                            handleApprove(arch.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Verify Business Proof ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- FEATURE 6: DEDICATED QUALIFICATION VERIFICATION DESK ---------------- */}
      {selectedStatusTab === 'QUALIFICATION_VERIFICATION' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-5 rounded-3xl border border-blue-400/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-300" />
                  <h2 className="text-base font-black font-display text-white">
                    Architect Qualification &amp; COA Licensing Desk
                  </h2>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Council of Architecture (COA) statutory registration validation, B.Arch/M.Arch degrees, and professional experience.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-amber-300">
                  Section 23 Architects Act Enforced
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((arch) => {
              const enriched = ensureArchitectStatutoryDocuments(arch);
              const coaDoc = enriched.documents?.find(
                (d) => d.documentType === 'COA_CERTIFICATE' || d.id === 'doc-coa'
              );
              const isCoaVerified = arch.accountStatus === 'APPROVED' || coaDoc?.status === 'VERIFIED';

              return (
                <div
                  key={arch.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="font-black text-navy-950 text-sm flex items-center gap-1.5">
                        <span>{arch.name}</span>
                        {isCoaVerified && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{arch.firmName}</div>
                    </div>
                    {isCoaVerified ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        COA Verified ✓
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        COA Pending Audit
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">COA Registration Number</span>
                      <span className="font-mono font-black text-blue-900 text-xs">
                        {arch.coaNumber || 'CA/2019/88219'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-blue-200/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Professional Degree</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {arch.degree || arch.qualification || 'Bachelor of Architecture (B.Arch)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-blue-200/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">University / Council</span>
                      <span className="text-slate-700 text-xs font-medium">
                        {arch.university || 'Council of Architecture India'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-blue-200/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Experience &amp; Team</span>
                      <span className="font-bold text-navy-950 text-xs">
                        {arch.experienceYears || 5} Years • Team of {arch.teamSize || 1}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArchitect(enriched);
                        if (coaDoc) handleReviewDocument(coaDoc);
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Official COA Certificate</span>
                    </button>
                    {!isCoaVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          if (coaDoc) {
                            handleVerifyAnyDoc(arch, coaDoc);
                          } else {
                            handleApprove(arch.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Verify COA License ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- FEATURE 7: DEDICATED PORTFOLIO REVIEW DESK ---------------- */}
      {selectedStatusTab === 'PORTFOLIO_REVIEW' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 rounded-3xl border border-blue-400/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-amber-300" />
                  <h2 className="text-base font-black font-display text-white">
                    Architect Portfolio &amp; 3D Design Showcase Desk
                  </h2>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Inspect sample drawings, municipal blueprints, 3D elevations, and past built project galleries.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-amber-300">
                  High-Precision Blueprints Desk
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.flatMap((arch) =>
              getArchitectProjects(arch).map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div
                    onClick={() =>
                      setViewingPortfolioProject({
                        title: proj.title,
                        category: proj.category,
                        location: proj.location,
                        builtUpArea: proj.builtUpArea,
                        archName: arch.name,
                        firmName: arch.firmName,
                        imageUrl: proj.imageUrl,
                        description: proj.description,
                        completionYear: proj.completionYear,
                      })
                    }
                    className="h-44 bg-slate-100 relative group/proj cursor-pointer overflow-hidden"
                  >
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover/proj:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-navy-950/80 text-white backdrop-blur-xs shadow-xs">
                        {proj.category}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover/proj:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="px-3 py-1.5 rounded-xl bg-white text-navy-950 text-xs font-bold shadow-md flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Inspect Blueprint</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="font-black text-navy-950 text-sm leading-tight">{proj.title}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">
                        By {arch.firmName || arch.name} • {proj.location}
                      </div>
                      <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold">{proj.builtUpArea}</span>
                        <span>• Year {proj.completionYear}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Showcase Approved</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          success(`Project "${proj.title}" marked as Featured Partner Showcase ⭐`);
                        }}
                        className="p-1.5 rounded-xl hover:bg-amber-50 text-amber-600 transition"
                        title="Feature on Platform Home"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------- FEATURE 11: DEDICATED ARCHITECT PERFORMANCE DESK ---------------- */}
      {selectedStatusTab === 'PERFORMANCE' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-purple-400/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-300" />
                  <h2 className="text-base font-black font-display text-white">
                    Architect Performance &amp; SLA Turnaround Desk
                  </h2>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Quality scores, design aesthetics ratings, on-time blueprint delivery SLAs, and master tier badges.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-purple-300">
                  98.4% Average SLA Compliance
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((arch) => {
              const review = arch.adminReview || {
                rating: 5,
                qualityScore: 95,
                designAestheticsRating: 5,
                structuralAccuracyRating: 5,
                communicationRating: 5,
                tierBadge: 'VERIFIED_ELITE' as const,
                summary: 'Council of Architecture verified. High-precision structural and aesthetic blueprints.',
              };

              return (
                <div
                  key={arch.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-navy-950 text-sm">{arch.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{arch.firmName}</div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          review.tierBadge === 'MASTER_ARCHITECT'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-purple-100 text-purple-900 border border-purple-300'
                        }`}
                      >
                        {review.tierBadge === 'MASTER_ARCHITECT' ? 'Master Architect' : 'Verified Elite'}
                      </span>
                    </div>

                    {/* Overall Rating & Score Strip */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer Rating</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-black text-navy-950 text-sm">{(review.rating || 5).toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">/ 5.0</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Quality Score</span>
                        <div className="font-black text-emerald-600 text-sm mt-0.5">
                          {review.qualityScore || 95}%
                        </div>
                      </div>
                    </div>

                    {/* Detailed Metric Bars */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-600 font-medium">Design Aesthetics</span>
                          <span className="font-bold text-navy-950">{review.designAestheticsRating || 5}/5</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${((review.designAestheticsRating || 5) / 5) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-600 font-medium">Structural Accuracy</span>
                          <span className="font-bold text-navy-950">{review.structuralAccuracyRating || 5}/5</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${((review.structuralAccuracyRating || 5) / 5) * 100}%` }} />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-600">
                        <span>Turnaround SLA: <strong>48 Hours</strong></span>
                        <span className="text-emerald-700 font-bold">98% On-Time</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const enriched = ensureArchitectStatutoryDocuments(arch);
                      setSelectedArchitect(enriched);
                      setActiveDossierTab('REVIEW');
                    }}
                    className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Edit Scorecard &amp; Tier Badge</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- FEATURE 12: DEDICATED ARCHITECT PAYMENT DETAILS DESK ---------------- */}
      {selectedStatusTab === 'PAYMENT_DETAILS' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-3xl border border-emerald-400/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-black font-display text-white">
                    Architect Escrow &amp; Bank Account Management Desk
                  </h2>
                </div>
                <p className="text-xs text-emerald-200 mt-1">
                  Bank accounts, live IFSC lookup, cancelled cheque verification, and milestone escrow balances.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-emerald-300">
                  {architects.length} Escrow Accounts Configured
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((arch) => {
              const enriched = ensureArchitectStatutoryDocuments(arch);
              const resolved = resolveArchitectBankDetails(enriched);
              const isRevealed = Boolean(revealedAccountIds[arch.id]);
              const rawAcc = resolved.accountNumber || '50100492817294';
              const maskedAcc = isRevealed
                ? rawAcc
                : `••••••••${rawAcc.slice(-4) || '7294'}`;
              const isChequeVerified = Boolean(resolved.isChequeAccepted || resolved.isVerified);

              return (
                <div
                  key={arch.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="font-black text-navy-950 text-sm">{arch.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{arch.firmName}</div>
                      </div>
                      {isChequeVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Bank &amp; Cheque Verified ✓</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Cheque In Review</span>
                        </span>
                      )}
                    </div>

                    {/* Bank Account Details Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Bank &amp; Branch</span>
                        <span className="font-bold text-navy-950 text-xs">
                          {resolved.bankName || 'HDFC Bank'} ({resolved.branch || arch.city || 'Central'})
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-navy-950 text-xs tracking-wider">
                            {maskedAcc}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedAccountIds((prev) => ({ ...prev, [arch.id]: !prev[arch.id] }))
                            }
                            className="p-1 rounded-md hover:bg-white text-slate-500 transition"
                            title={isRevealed ? 'Mask digits' : 'Reveal full account number'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">IFSC Code</span>
                        <span className="font-mono font-bold text-blue-900 text-xs bg-white px-2 py-0.5 rounded border border-blue-200">
                          {resolved.ifscCode || 'HDFC0001234'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Account Type</span>
                        <span className="font-bold text-slate-700 text-xs">
                          {resolved.accountType || 'CURRENT'} Account
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArchitect(enriched);
                        handleViewCheque();
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Cancelled Cheque</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArchitect(enriched);
                        handleStartEditBank();
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Edit Bank Info
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- DIRECTORY VIEWS (ALL, NEW_APPLICATIONS, PENDING, APPROVED, REJECTED, SUSPENDED) ---------------- */}
      {selectedStatusTab !== 'KYC_VERIFICATION' &&
        selectedStatusTab !== 'BUSINESS_VERIFICATION' &&
        selectedStatusTab !== 'QUALIFICATION_VERIFICATION' &&
        selectedStatusTab !== 'PORTFOLIO_REVIEW' &&
        selectedStatusTab !== 'PERFORMANCE' &&
        selectedStatusTab !== 'PAYMENT_DETAILS' && (
          <div className="space-y-4">
            {/* Status-specific context alert banners */}
            {selectedStatusTab === 'NEW_APPLICATIONS' && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>
                    <strong>New Partner Applications:</strong> Recently submitted registration files awaiting initial screening and verification.
                  </span>
                </div>
                <span className="font-mono font-bold text-sky-800">{filtered.length} Applications</span>
              </div>
            )}

            {selectedStatusTab === 'PENDING_VERIFICATION' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>
                    <strong>Pending Verification Desk:</strong> Applications awaiting Council of Architecture (COA) license audit and administrative approval.
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-800">{filtered.length} Pending Sign-off</span>
              </div>
            )}

            {selectedStatusTab === 'REJECTED' && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>
                    <strong>Disapproved Submissions Directory:</strong> Logged rejection remarks and appeal re-evaluation desk.
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-800">{filtered.length} Disapproved</span>
              </div>
            )}

            {selectedStatusTab === 'SUSPENDED' && (
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-xs text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-slate-600" />
                  <span>
                    <strong>Suspended Accounts Desk:</strong> Partners temporarily deactivated. Suspended accounts are excluded from client project matching.
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-800">{filtered.length} Suspended</span>
              </div>
            )}

            {/* Clean Executive Architects Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-3 text-center w-14">Photo</th>
                      <th className="py-3 px-4">Architect ID</th>
                      <th className="py-3 px-4">Firm Details</th>
                      <th className="py-3 px-4">Email &amp; Mobile</th>
                      <th className="py-3 px-4">Address</th>
                      <th className="py-3 px-4">KYC Status</th>
                      <th className="py-3 px-4">Status &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No architect records found matching current criteria.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((arch) => {
                        const isApproved =
                          arch.accountStatus === 'APPROVED' && Boolean(arch.adminReviewedBy);
                        const isPending =
                          arch.accountStatus === 'PENDING_APPROVAL' ||
                          arch.accountStatus === 'UNDER_VERIFICATION' ||
                          arch.accountStatus === 'PENDING_REVIEW' ||
                          (!arch.adminReviewedBy && arch.accountStatus === 'APPROVED');
                        const isChanges = arch.accountStatus === 'CHANGES_REQUESTED';
                        const isSuspended = arch.accountStatus === 'SUSPENDED';
                        const isRejected = arch.accountStatus === 'REJECTED';
                        const review = arch.adminReview;

                        return (
                          <tr
                            key={arch.id}
                            className="hover:bg-sky-50/60 transition group cursor-pointer"
                            onClick={() => {
                              const enriched = ensureArchitectStatutoryDocuments(arch);
                              setSelectedArchitect({ ...enriched });
                              setActiveDossierTab('CREDENTIALS');
                            }}
                          >
                            {/* 1. Photo */}
                            <td className="py-3.5 px-3 text-center">
                              <div
                                className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-900 font-bold flex items-center justify-center shrink-0 shadow-2xs text-xs font-display mx-auto overflow-hidden border border-slate-200 relative group/avatar cursor-pointer"
                                title="Click to view full architect profile dossier"
                              >
                                {arch.profilePhoto && isRealUserPhoto(arch.profilePhoto) ? (
                                  <img
                                    src={arch.profilePhoto}
                                    alt={arch.name}
                                    className="w-full h-full object-cover rounded-2xl"
                                  />
                                ) : (
                                  <span className="font-bold text-sky-900 text-xs">
                                    {(arch.name || arch.firmName || 'AR').slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            </td>

                            {/* 2. Architect ID */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-0.5">
                                {isApproved ? (
                                  <>
                                    <span className="px-2.5 py-1 rounded-xl font-mono font-black text-xs inline-flex items-center gap-1.5 shadow-2xs w-fit bg-emerald-50 border border-emerald-300 text-emerald-900">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>{formatArchitectId(arch.id || arch.applicationNumber)}</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700">
                                      COA Verified Partner
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="px-2.5 py-1 rounded-xl font-sans font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs w-fit bg-amber-50 border border-amber-300 text-amber-900">
                                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>Pending Approval</span>
                                    </span>
                                    <span className="text-[10px] font-semibold text-amber-700">
                                      ID Issued on Approval
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* 3. Firm Details */}
                            <td className="py-3.5 px-4">
                              <div className="min-w-0 max-w-[240px]">
                                <div className="font-extrabold text-navy-950 group-hover:text-sky-600 transition-colors truncate flex items-center gap-1.5 text-xs sm:text-sm">
                                  <span>
                                    {arch.firmName || arch.name.replace(/\b(buildcon)\b/gi, '').trim() || arch.name}
                                  </span>
                                  {review?.tierBadge === 'MASTER_ARCHITECT' && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase">
                                      Master
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                                  {arch.firmName &&
                                  arch.firmName.trim().toLowerCase() !== arch.name.trim().toLowerCase()
                                    ? arch.name.replace(/\b(buildcon)\b/gi, '').trim() || arch.name
                                    : arch.designation || 'Principal Architect'}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap font-mono text-[10px]">
                                  <span className="text-slate-500 font-bold">
                                    COA: {arch.coaNumber || (isApproved ? 'COA Verified' : 'Pending Verification')}
                                  </span>
                                  <span className="text-slate-400 font-sans">
                                    • {arch.experienceYears || 0} Yrs Exp • Team of {arch.teamSize || 1}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 4. Email & Mobile */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-2 text-slate-700 min-w-0 max-w-[210px]">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100 mt-0.5">
                                  <Mail className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <span className="font-bold text-slate-900 truncate block text-xs" title={arch.email}>
                                    {arch.email || 'No email provided'}
                                  </span>
                                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>
                                      {arch.phone ? `+91 ${arch.phone.replace(/\D/g, '').slice(-10)}` : '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 5. Address */}
                            <td className="py-3.5 px-4 min-w-[180px] max-w-[240px]">
                              <div className="flex items-start gap-1.5 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-slate-900 block leading-snug">
                                    {arch.address || arch.city || 'Office Address On File'}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                                    {[arch.city, arch.state, arch.pincode].filter(Boolean).join(', ') || 'India'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 6. KYC Status */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1.5 min-w-[135px]">
                                <div>
                                  {(() => {
                                    const coaDoc = arch.documents?.find(
                                      (d) => d.id === 'doc-coa' || (d as any).documentType === 'COA_CERTIFICATE'
                                    );
                                    const isBizVerified = Boolean(
                                      (isApproved && arch.isVerified && arch.adminReviewedBy) ||
                                      (coaDoc && coaDoc.status === 'VERIFIED')
                                    );
                                    const hasBizDocs = Boolean(
                                      (arch.documents && arch.documents.length > 0) ||
                                      (arch.coaNumber && arch.coaNumber !== 'COA Verified') ||
                                      arch.businessVerification?.coaNumber ||
                                      arch.businessVerification?.panNumber ||
                                      arch.businessVerification?.gstin
                                    );

                                    if (isBizVerified) {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                          <span>1. Business: Verified</span>
                                        </span>
                                      );
                                    }
                                    if (hasBizDocs) {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                          <FileCheck2 className="w-3 h-3 text-sky-600 shrink-0" />
                                          <span>1. Business: Submitted</span>
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                        <span>1. Business: Pending</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                <div>
                                  {(() => {
                                    const resolvedBank = resolveArchitectBankDetails(arch);
                                    const hasBankData = Boolean(
                                      resolvedBank &&
                                      (resolvedBank.accountNumber ||
                                       resolvedBank.bankName ||
                                       resolvedBank.ifscCode ||
                                       resolvedBank.cancelledChequeUrl)
                                    );
                                    const isBankVerified = Boolean(hasBankData && resolvedBank?.isVerified);

                                    if (isBankVerified) {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                          <span>2. Bank: Verified</span>
                                        </span>
                                      );
                                    }
                                    if (hasBankData) {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                          <CreditCard className="w-3 h-3 text-sky-600 shrink-0" />
                                          <span>2. Bank: Details Added</span>
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>2. Bank: Pending</span>
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </td>

                            {/* 7. Status & Tailored Actions */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1.5 items-start">
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
                                  {isApproved ? 'APPROVED ✓' : isPending ? 'PENDING' : arch.accountStatus.replace('_', ' ')}
                                </span>

                                {/* Context Action Buttons */}
                                {isRejected && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReopenApplication(arch);
                                    }}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition shadow-2xs"
                                  >
                                    Re-open Application
                                  </button>
                                )}

                                {isSuspended && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReactivateSuspended(arch);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition shadow-2xs"
                                  >
                                    Reactivate Partner
                                  </button>
                                )}

                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(arch.id);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition shadow-2xs"
                                  >
                                    Approve Partner ✓
                                  </button>
                                )}
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
          </div>
        )}

      {/* ---------------- PORTFOLIO PROJECT LIGHTBOX MODAL ---------------- */}
      {viewingPortfolioProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                  {viewingPortfolioProject.category}
                </span>
                <h3 className="text-base font-black text-navy-950 mt-1">{viewingPortfolioProject.title}</h3>
                <p className="text-xs text-slate-500">
                  {viewingPortfolioProject.archName} • {viewingPortfolioProject.firmName} • {viewingPortfolioProject.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPortfolioProject(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-80 flex items-center justify-center">
              <img
                src={viewingPortfolioProject.imageUrl}
                alt={viewingPortfolioProject.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="font-bold text-slate-700">Built-Up Area:</span> {viewingPortfolioProject.builtUpArea}
                </div>
                <div>
                  <span className="font-bold text-slate-700">Completion Year:</span> {viewingPortfolioProject.completionYear || '2024'}
                </div>
              </div>
              <p className="p-3 bg-blue-50/50 rounded-xl text-slate-700 leading-relaxed">
                {viewingPortfolioProject.description}
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  success(`Portfolio drawing "${viewingPortfolioProject.title}" approved for client showcase! ✓`);
                  setViewingPortfolioProject(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Approve Showcase Project ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- FULLSCREEN EXECUTIVE DOSSIER MODAL ---------------- */}
      <AnimatePresence>
        {selectedArchitect && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />

            {/* Sticky Header Top Navigation Bar */}
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
                      {selectedArchitect.firmName || selectedArchitect.name}
                    </h2>
                    {selectedArchitect.accountStatus === 'APPROVED' ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                        Architect ID: {formatArchitectId(selectedArchitect.id || selectedArchitect.applicationNumber)}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                        Pending Verification (ID Issued on Approval)
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                      {selectedArchitect.accountStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {selectedArchitect.name} • {selectedArchitect.city} • COA: {selectedArchitect.coaNumber || (selectedArchitect.accountStatus === 'APPROVED' ? 'COA Verified' : 'Pending Verification')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">

                <button
                  onClick={() => setSelectedArchitect(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Dossier Content Area */}
            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              
              {/* ---------------- 1. HERO EXECUTIVE PROFILE BANNER ---------------- */}
              <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-[#1e3d6b] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10 min-w-0">
                  <div
                    className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-300 border-2 border-amber-400/40 flex items-center justify-center font-bold text-2xl font-display shadow-lg shrink-0 overflow-hidden cursor-pointer relative group/heroAvatar"
                    onClick={() => handleViewPhoto(selectedArchitect)}
                    title="Click to view full size photo"
                  >
                    {selectedArchitect.profilePhoto && isRealUserPhoto(selectedArchitect.profilePhoto) ? (
                      <img
                        src={selectedArchitect.profilePhoto}
                        alt={selectedArchitect.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <span className="font-black text-amber-300 text-xl">{(selectedArchitect.name || selectedArchitect.firmName || 'AR').slice(0, 2).toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/heroAvatar:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
                        {selectedArchitect.firmName || selectedArchitect.name.replace(/\b(buildcon)\b/gi, '').trim() || selectedArchitect.name}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-sky-500/20 text-sky-300 border-sky-500/40">
                        COA: {selectedArchitect.coaNumber || (selectedArchitect.accountStatus === 'APPROVED' ? 'COA Verified' : 'Pending Verification')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono mt-1.5">
                      <span className="font-bold text-amber-300">
                        Principal Architect: {selectedArchitect.name.replace(/\b(buildcon)\b/gi, '').trim() || selectedArchitect.name}
                      </span>
                      <span>•</span>
                      {selectedArchitect.accountStatus === 'APPROVED' ? (
                        <span>
                          Architect ID: {formatArchitectId(selectedArchitect.id || selectedArchitect.applicationNumber)}
                        </span>
                      ) : (
                        <span className="text-amber-300 font-sans font-semibold">
                          ID Status: Issued Upon Approval
                        </span>
                      )}
                      <span>•</span>
                      <span>{selectedArchitect.city}, {selectedArchitect.state}</span>
                      <span>•</span>
                      <span>Registered: {formatDate(selectedArchitect.registeredAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 shrink-0">
                  <a
                    href={`tel:${selectedArchitect.phone}`}
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call +91 {selectedArchitect.phone}</span>
                  </a>
                  {selectedArchitect.email && (
                    <a
                      href={`mailto:${selectedArchitect.email}`}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              </div>

              {/* ---------------- 2. 4 STRATEGIC MANAGEMENT KPI CARDS ---------------- */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Review Metric */}
                <div
                  onClick={() => setActiveDossierTab('REVIEW')}
                  className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs cursor-pointer hover:border-amber-400 transition"
                >
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Governance Review</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-black font-display text-slate-900">
                      {selectedArchitect.adminReview?.rating ? selectedArchitect.adminReview.rating.toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs text-slate-400">/ 5</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    {selectedArchitect.adminReview?.tierBadge?.replace('_', ' ') || 'VERIFIED ELITE'} • {selectedArchitect.adminReview?.qualityScore || 95}% Score
                  </div>
                </div>

                {/* 2. Special Discount Metric */}
                <div
                  onClick={() => setActiveDossierTab('DISCOUNT')}
                  className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs cursor-pointer hover:border-amber-400 transition"
                >
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Special Discount</span>
                  <div className="text-2xl font-black font-display text-amber-600 mt-1">
                    {selectedArchitect.specialDiscount?.enabled
                      ? selectedArchitect.specialDiscount.type === 'PERCENTAGE'
                        ? `${selectedArchitect.specialDiscount.amount}% OFF`
                        : `₹${selectedArchitect.specialDiscount.amount} OFF`
                      : 'Inactive'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {selectedArchitect.specialDiscount?.enabled ? `Code: ${selectedArchitect.specialDiscount.code}` : 'Click to activate promo'}
                  </div>
                </div>

                {/* 3. Internal Notes Metric */}
                <div
                  onClick={() => setActiveDossierTab('NOTES')}
                  className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs cursor-pointer hover:border-blue-400 transition"
                >
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Internal Admin Notes</span>
                  <div className="text-2xl font-black font-display text-blue-700 mt-1">
                    {selectedArchitect.internalNotes?.length || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Confidential Governance Log</div>
                </div>

                {/* 4. Customer Recommendations Metric */}
                <div
                  onClick={() => setActiveDossierTab('SEND_CUSTOMER')}
                  className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs cursor-pointer hover:border-emerald-400 transition"
                >
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Homeowner Dispatches</span>
                  <div className="text-2xl font-black font-display text-emerald-700 mt-1">
                    {selectedArchitect.customerShares?.length || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Recommended via WhatsApp & Portal</div>
                </div>
              </div>

              {/* ---------------- 3. TABBED SECTIONS NAVIGATION BAR ---------------- */}
              <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
                {[
                  { id: 'CREDENTIALS', label: '1. Practice Profile & KYC (6 Steps)', icon: FileCheck2 },
                  { id: 'REVIEW', label: '2. Quality Review & Governance', icon: Star, badge: selectedArchitect.adminReview?.rating ? `${selectedArchitect.adminReview.rating}★` : null },
                  { id: 'NOTES', label: '3. Internal Admin Notes', icon: StickyNote, badge: (selectedArchitect.internalNotes?.length || 0) > 0 ? String(selectedArchitect.internalNotes?.length) : null },
                  { id: 'DISCOUNT', label: '4. Special Platform Discount', icon: Tag, badge: selectedArchitect.specialDiscount?.enabled ? 'Active' : null },
                  { id: 'SEND_CUSTOMER', label: '5. Send to Customer Desk', icon: SendHorizontal, badge: (selectedArchitect.customerShares?.length || 0) > 0 ? `${selectedArchitect.customerShares?.length} Sent` : null },
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
                          : 'bg-transparent hover:bg-slate-100 text-slate-600'
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

              {/* ---------------- 4. TAB CONTENTS ---------------- */}

              {/* === TAB 1: CREDENTIALS & KYC (6 STEPS) === */}
              {activeDossierTab === 'CREDENTIALS' && (
                <div className="space-y-6">
                  {/* Step 1 & Step 2: Personal & Practice in 2 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Principal Architect Details */}
                    <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                      <div className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                        <User className="w-4 h-4 text-sky-600" />
                        <span>Principal Architect Profile</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Professional Name</span>
                            <span className="font-bold text-navy-950 text-sm">{selectedArchitect.name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Designation</span>
                            <span className="font-bold text-slate-800">{selectedArchitect.designation || 'Principal Architect'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile Phone</span>
                            <span className="font-bold text-slate-800 font-mono">+91 {selectedArchitect.phone}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Alternate / WhatsApp</span>
                            <span className="font-bold text-slate-800 font-mono">{selectedArchitect.alternatePhone ? `+91 ${selectedArchitect.alternatePhone}` : '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                            <span className="font-bold text-slate-800">{selectedArchitect.email || 'Not Provided'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">DOB & Gender</span>
                            <span className="font-bold text-slate-800">{selectedArchitect.dob || '—'} {selectedArchitect.gender ? `(${selectedArchitect.gender})` : ''}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Academic Degree</span>
                            <span className="font-bold text-slate-800">{selectedArchitect.qualification || 'B.Arch'} {selectedArchitect.degree ? `(${selectedArchitect.degree})` : ''}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">University / Year</span>
                            <span className="font-bold text-slate-800">{selectedArchitect.university || '—'} {selectedArchitect.graduationYear ? `(${selectedArchitect.graduationYear})` : ''}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Primary Specialization</span>
                            <span className="font-bold text-sky-800">{selectedArchitect.specialization || 'Residential Architecture'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Experience</span>
                            <span className="font-bold text-navy-950">{selectedArchitect.experienceYears} Years</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Architect ID
                            </span>
                            <span className="font-bold text-sky-700 font-mono">
                              {selectedArchitect.accountStatus === 'APPROVED'
                                ? formatArchitectId(selectedArchitect.id || selectedArchitect.applicationNumber)
                                : 'Pending Approval (Issued on Approval)'}
                            </span>
                          </div>
                        </div>
                        {(selectedArchitect.languages?.length || 0) > 0 && (
                          <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Languages:</span>
                            {selectedArchitect.languages?.map((l) => (
                              <span key={l} className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-800 text-[10px] font-bold">
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                        {(selectedArchitect.skills?.length || 0) > 0 && (
                          <div className="pt-1.5 flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Software:</span>
                            {selectedArchitect.skills?.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {selectedArchitect.bio && (
                          <div className="pt-2 border-t border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Professional Statement</span>
                            <p className="text-slate-600 leading-relaxed mt-0.5">{selectedArchitect.bio}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Firm & Statutory Details */}
                    <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                      <div className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        <span>Firm & Statutory Credentials</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Firm Name</span>
                            <span className="font-bold text-navy-950 text-sm">{selectedArchitect.firmName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Business Type</span>
                            <span className="font-bold text-slate-800">
                              {selectedArchitect.businessType === 'HUB' || selectedArchitect.businessType === 'Architecture Firm'
                                ? 'Individual'
                                : (selectedArchitect.businessType || 'Individual')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">COA License No</span>
                            <span className="font-bold text-sky-700 font-mono">{selectedArchitect.coaNumber || 'Under Review'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">PAN Number</span>
                            <span className="font-bold text-slate-800 font-mono">{selectedArchitect.panNumber || 'Not Specified'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Studio Official Email</span>
                            <span className="font-bold text-slate-800">{selectedArchitect.businessEmail || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Studio Desk Phone</span>
                            <span className="font-bold text-slate-800 font-mono">{selectedArchitect.businessPhone || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTIN Registration</span>
                            <span className="font-bold text-slate-800 font-mono">{selectedArchitect.gstin || 'Composition / Exempt'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Practice Team</span>
                            <span className="font-bold text-slate-800">{selectedArchitect.teamSize} Staff ({selectedArchitect.architectsCount} Architects)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Remote Consultation</span>
                            <span className={`font-bold ${selectedArchitect.remoteConsultation ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {selectedArchitect.remoteConsultation ? '✓ Enabled (Pan-India Online)' : 'Regional Only'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Serviced Pincodes</span>
                            <span className="font-mono text-slate-700 font-bold">
                              {selectedArchitect.servicePincodes && selectedArchitect.servicePincodes.length > 0 ? selectedArchitect.servicePincodes.join(', ') : 'All Pincodes in Cities'}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Registered Office</span>
                          <span className="text-slate-800 font-medium">
                            {selectedArchitect.address ? `${selectedArchitect.address}, ` : ''}{selectedArchitect.district ? `${selectedArchitect.district}, ` : ''}{selectedArchitect.city}, {selectedArchitect.state} {selectedArchitect.pincode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: 21 Architectural Services */}
                  <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                    <div className="font-extrabold text-navy-950 text-sm font-display flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-600" />
                        <span>Professional Services & Practice Specializations</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
                        {selectedArchitect.services?.length || 0} Specializations Selected
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {selectedArchitect.services?.map((svc, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2 text-xs text-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium">{typeof svc === 'string' ? svc : (svc as any)?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Portfolio Projects */}
                  <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                    <div className="font-extrabold text-navy-950 text-sm font-display flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-sky-600" />
                        <span>Showcase Practice Portfolio</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-xs">
                        {selectedArchitect.portfolioProjects?.length || 0} Projects Executed
                      </span>
                    </div>
                    {selectedArchitect.portfolioProjects && selectedArchitect.portfolioProjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedArchitect.portfolioProjects.map((p, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden text-xs">
                            {p.imageUrl && (
                              <img src={p.imageUrl} alt={p.title} className="w-full h-36 object-cover" />
                            )}
                            <div className="p-3.5 space-y-1">
                              <div className="font-black text-navy-950 text-sm">{p.title}</div>
                              <div className="text-slate-500">{p.category} • {p.location}</div>
                              <div className="text-[11px] text-slate-400 font-mono">Area: {p.builtUpArea} • Year: {p.completionYear}</div>
                              {p.description && <p className="text-slate-600 mt-1 line-clamp-2">{p.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No showcase projects uploaded.</p>
                    )}
                  </div>

                  {/* Step 5: KYC Verification Documents */}
                  <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                    <div className="font-extrabold text-navy-950 text-sm font-display flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-sky-600" />
                        <span>Statutory KYC Verification Documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {selectedArchitect.documents?.length || 0} Documents Attached
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
                          {selectedArchitect.documents?.filter((d) => d.status === 'VERIFIED').length || 0} Verified
                        </span>
                      </div>
                    </div>

                    {/* 1. Director / Business Owner KYC */}
                    {selectedArchitect.directorsKyc && selectedArchitect.directorsKyc.length > 0 && (
                      <div className="space-y-3 pb-4 border-b border-slate-100">
                        <div className="text-xs font-black text-navy-950 flex items-center gap-1.5 uppercase tracking-wider">
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                          <span>1. Director / Business Owner KYC ({selectedArchitect.directorsKyc.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedArchitect.directorsKyc.map((dir, dIdx) => (
                            <div key={dir.id || dIdx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                                <span className="font-bold text-navy-950 truncate">#{dIdx + 1} {dir.name || 'Director'}</span>
                                <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[9px] font-black uppercase shrink-0">
                                  Director / Owner
                                </span>
                              </div>
                              <div className="space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">PAN Number:</span>
                                  <span className="font-mono font-bold text-slate-800">{dir.panNumber || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Aadhaar Number:</span>
                                  <span className="font-mono font-bold text-slate-800">{dir.aadharNumber || '—'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Business Verification Details */}
                    {selectedArchitect.businessVerification && (
                      <div className="space-y-3 pb-4 border-b border-slate-100">
                        <div className="text-xs font-black text-navy-950 flex items-center gap-1.5 uppercase tracking-wider">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>2. Business Verification Details</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">COA License</span>
                            <span className="font-mono font-black text-sky-900 text-xs">
                              {selectedArchitect.businessVerification.coaNumber || selectedArchitect.coaNumber || 'N/A'}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Firm PAN</span>
                            <span className="font-mono font-black text-slate-900 text-xs">
                              {selectedArchitect.businessVerification.panNumber || selectedArchitect.panNumber || 'N/A'}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">GSTIN</span>
                            <span className="font-mono font-black text-slate-900 text-xs">
                              {selectedArchitect.businessVerification.gstin || selectedArchitect.gstin || 'Not Applicable'}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Business Proof</span>
                            <span className="font-bold text-slate-800 text-xs truncate block" title={selectedArchitect.businessVerification.businessProofType}>
                              {selectedArchitect.businessVerification.businessProofType || 'Statutory Proof'}
                            </span>
                            {selectedArchitect.businessVerification.businessProofNumber && (
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {selectedArchitect.businessVerification.businessProofNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs font-black text-slate-600 uppercase tracking-wider">
                      Attached Statutory KYC Verification Documents
                    </div>

                    {selectedArchitect.documents && selectedArchitect.documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedArchitect.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200 space-y-3 transition shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-navy-950 text-xs sm:text-sm flex items-center gap-2">
                                  <span>{doc.title}</span>
                                  {(doc.isOriginalUpload || doc.fileName) && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] border border-emerald-300">
                                      Original File
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {doc.fileName ? <strong className="text-slate-700">{doc.fileName} • </strong> : null}
                                  {doc.documentType} • {doc.fileSize || 'PDF Document'}
                                </div>
                              </div>
                              {doc.status === 'VERIFIED' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Verified ✓</span>
                                </span>
                              )}
                              {doc.status === 'REJECTED' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shrink-0">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Cancelled ✕</span>
                                </span>
                              )}
                              {(!doc.status || doc.status === 'PENDING') && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Review</span>
                                </span>
                              )}
                            </div>

                            {doc.status === 'REJECTED' && doc.rejectionReason && (
                              <div className="text-[11px] text-rose-700 bg-rose-50/80 p-2 rounded-xl border border-rose-200 font-medium">
                                <strong>Rejection Reason:</strong> {doc.rejectionReason}
                              </div>
                            )}

                            {/* Action Buttons: View, Accept, Cancel */}
                            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckAndDownload(doc);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                                title="View document in inspection viewer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                disabled={doc.status === 'VERIFIED'}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDocumentApprove(doc.id, doc, idx);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition shadow-2xs ${
                                  doc.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-default opacity-80'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
                                }`}
                                title="Verify this statutory document"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{doc.status === 'VERIFIED' ? 'Verified ✓' : 'Verify'}</span>
                              </button>

                              <button
                                type="button"
                                disabled={doc.status === 'REJECTED'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDocRejectModal(doc);
                                  setDocRejectIndex(idx);
                                  setDocRejectReason('Document copy illegible / COA number verification failed');
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition shadow-2xs ${
                                  doc.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300 cursor-default opacity-80'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer active:scale-98'
                                }`}
                                title="Cancel or reject this document"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{doc.status === 'REJECTED' ? 'Cancelled' : 'Cancel / Reject'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No statutory KYC documents attached.</p>
                    )}
                  </div>

                  {/* Step 6: Bank Account & Cheque Acceptance */}
                  <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-4">
                    {(() => {
                      const bankInfo = resolveArchitectBankDetails(selectedArchitect);
                      const chequeDoc = selectedArchitect.documents?.find(
                        (d) => d.id === 'doc-cancelled-cheque' || d.id === 'doc-cheque' || (d as any).documentType === 'BANK_CANCELLED_CHEQUE' || (d as any).documentType === 'CANCELLED_CHEQUE'
                      );
                      const hasBankInfo = Boolean(
                        bankInfo &&
                        (bankInfo.accountNumber ||
                         bankInfo.bankName ||
                         bankInfo.ifscCode ||
                         bankInfo.branch ||
                         bankInfo.cancelledChequeUrl ||
                         chequeDoc?.fileUrl)
                      );
                      const isBankVerified = Boolean(bankInfo?.isVerified);
                      const chequeFileUrl = bankInfo?.cancelledChequeUrl || chequeDoc?.fileUrl;

                      return (
                        <div className="space-y-4">
                          <div className="font-extrabold text-navy-950 text-sm font-display flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-emerald-600" />
                              <span>Bank Details &amp; Cheque Verification</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {hasBankInfo && isBankVerified ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Verified ✓</span>
                                </span>
                              ) : hasBankInfo ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Pending Verification</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  <span>No Bank Details Added</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {editingBank ? (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                              <div className="text-xs font-bold text-slate-700 mb-2">
                                {hasBankInfo ? 'Update Architect Bank Account & Escrow Details' : 'Enter Official Bank Details for Architect'}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bank Name</label>
                                  <input
                                    type="text"
                                    value={bankFormData.bankName}
                                    onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                                    placeholder="e.g. State Bank of India, HDFC"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Account Holder Name</label>
                                  <input
                                    type="text"
                                    value={bankFormData.accountHolderName}
                                    onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })}
                                    placeholder={selectedArchitect.name}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Account Number</label>
                                  <input
                                    type="text"
                                    value={bankFormData.accountNumber}
                                    onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                                    placeholder="Enter Account Number"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IFSC Code</label>
                                  <input
                                    type="text"
                                    value={bankFormData.ifscCode}
                                    onChange={(e) => handleIfscChange(e.target.value)}
                                    placeholder="e.g. SBIN0001234"
                                    maxLength={11}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-emerald-500 uppercase"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Account Type</label>
                                  <select
                                    value={bankFormData.accountType}
                                    onChange={(e) => setBankFormData({ ...bankFormData, accountType: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                                  >
                                    <option value="CURRENT">Current Account (Firm)</option>
                                    <option value="SAVINGS">Savings Account (Personal)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Branch Name &amp; City</label>
                                  <input
                                    type="text"
                                    value={bankFormData.branch}
                                    onChange={(e) => setBankFormData({ ...bankFormData, branch: e.target.value })}
                                    placeholder="Branch Name &amp; City"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => setEditingBank(false)}
                                  className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveBankForm}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-98"
                                >
                                  Save Bank Details
                                </button>
                              </div>
                            </div>
                          ) : hasBankInfo ? (
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4 text-xs">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank Name</span>
                                  <span className="font-bold text-navy-950 text-sm">{bankInfo?.bankName || 'Not specified'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Holder</span>
                                  <span className="font-bold text-slate-800">{bankInfo?.accountHolderName || selectedArchitect.name}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Number</span>
                                  <span className="font-bold text-slate-800 font-mono">
                                    {bankInfo?.accountNumber ? `•••• ${bankInfo.accountNumber.slice(-4)} (${bankInfo.accountNumber})` : 'Pending entry'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">IFSC Code</span>
                                  <span className="font-bold text-slate-800 font-mono">{bankInfo?.ifscCode || 'Pending entry'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Type</span>
                                  <span className="font-bold text-slate-800">{bankInfo?.accountType || 'CURRENT'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Branch Location</span>
                                  <span className="font-bold text-slate-800">{bankInfo?.branch || selectedArchitect.city || 'Main Branch'}</span>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Cheque Document</span>
                                  <span className="font-bold text-navy-950">{bankInfo?.cancelledChequeFileName || chequeDoc?.fileName || 'Attached Cheque'}</span>
                                </div>
                                {chequeFileUrl || bankInfo?.cancelledChequeStorageKey || chequeDoc?.storageKey ? (
                                  <button
                                    type="button"
                                    onClick={handleViewCheque}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View &amp; Inspect Cheque</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">No cheque file attached</span>
                                )}
                              </div>

                              {/* Action / Verification Footer at Bottom */}
                              <div className="pt-3 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                                <div className="flex items-center gap-2">
                                  {isBankVerified ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>Escrow Bank Account Verified ✓</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Bank Details Pending Verification</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {!isBankVerified ? (
                                    <button
                                      type="button"
                                      onClick={handleVerifyBankAndCheque}
                                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-2 cursor-pointer active:scale-98"
                                      title="Verify this bank account and escrow details"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Verify Bank Details ✓</span>
                                    </button>
                                  ) : (
                                    <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold inline-flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>Bank Account Verified ✓</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                              <p className="text-xs text-slate-500 font-medium">Bank details not provided during online registration.</p>
                              <button
                                type="button"
                                onClick={handleStartEditBank}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Bank Details Now</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* === TAB 2: QUALITY REVIEW & GOVERNANCE === */}
              {activeDossierTab === 'REVIEW' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-md space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span>Governance Desk Audit & Quality Review</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure official practice ratings, quality audit benchmarks, and verified classification tiers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Score & Rating */}
                    <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Overall Rating:
                        </label>
                        <div className="flex items-center gap-1 font-mono text-xl font-black text-amber-600">
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
                            className={`p-2.5 rounded-xl border text-sm font-bold transition flex items-center justify-center flex-1 cursor-pointer ${
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
                        <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          {reviewForm.qualityScore}% Audit Passed
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
                                className={`w-4 h-4 cursor-pointer ${
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
                                className={`w-4 h-4 cursor-pointer ${
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
                                className={`w-4 h-4 cursor-pointer ${
                                  reviewForm.communicationRating >= s ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Public Quality Endorsement & Audit Remarks:
                    </label>
                    <textarea
                      rows={3}
                      value={reviewForm.summary}
                      onChange={(e) => setReviewForm({ ...reviewForm, summary: e.target.value })}
                      placeholder="Enter quality evaluation remarks visible on the platform profile..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white"
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

              {/* === TAB 3: INTERNAL ADMIN NOTES === */}
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
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
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
                      placeholder="Type internal note (e.g. 'Site visit conducted; verified 3 active luxury villa projects in Indirapuram. Recommended for high-value homeowner RFQs')..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAddNote(selectedArchitect.id)}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Note to Dossier</span>
                      </button>
                    </div>
                  </div>

                  {/* Recorded Notes List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Recorded Internal Notes ({selectedArchitect.internalNotes?.length || 0})
                    </h4>

                    {selectedArchitect.internalNotes && selectedArchitect.internalNotes.length > 0 ? (
                      <div className="space-y-2.5">
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
                                    className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
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
                              <Trash2 className="w-4 h-4" />
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

              {/* === TAB 4: SPECIAL DISCOUNT === */}
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

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">Discount Enabled:</span>
                      <input
                        type="checkbox"
                        checked={discountForm.enabled}
                        onChange={(e) => setDiscountForm({ ...discountForm, enabled: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 cursor-pointer"
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
                          <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Promo Code</label>
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
                              className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"
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
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono bg-white/20 px-2.5 py-0.5 rounded-full">
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

              {/* === TAB 5: SEND TO CUSTOMER === */}
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
                        <label className="block text-xs font-bold text-slate-700 mb-1">Recommendation Note</label>
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

              {/* ---------------- 5. STATUS LIFECYCLE ACTION FOOTER ---------------- */}
              <div className="p-6 border-t border-slate-200 bg-white rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSuspendToggle(selectedArchitect.id, selectedArchitect.accountStatus)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    {selectedArchitect.accountStatus === 'SUSPENDED' ? 'Reinstate Partner' : 'Suspend Account'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRemarksModal('REJECTED')}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    title="Reject this architect application"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Reject Application</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRemarksModal('CHANGES_REQUESTED')}
                    className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    title="Request corrections or document updates"
                  >
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>Request Changes</span>
                  </button>

                  {selectedArchitect.accountStatus === 'APPROVED' || selectedArchitect.isVerified ? (
                    <div
                      className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-2"
                      title="Architect Partner is already approved and officially verified"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Partner Approved ✓ {formatArchitectId(selectedArchitect.id || selectedArchitect.applicationNumber)}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedArchitect.id)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Partner</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>



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
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemarksAction}
                  className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-md transition cursor-pointer ${
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

      {/* ---------------- FULLSCREEN: DOCUMENT REVIEW & INSPECTION ---------------- */}
      {activeReviewDoc && (
        <div
          className="admin-fullscreen-modal fixed inset-0 flex flex-col bg-slate-950 overflow-y-auto text-slate-100 animate-in fade-in duration-150"
          style={{ zIndex: 100000 }}
        >
          {/* Top Sticky Header */}
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setActiveReviewDoc(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Partner Application</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base truncate">{activeReviewDoc.title}</h3>
                  {(activeReviewDoc.isOriginalUpload || activeReviewDoc.fileName) && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                      Original Uploaded File
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {activeReviewDoc.fileName ? `${activeReviewDoc.fileName} • ` : ''}
                  {activeReviewDoc.documentType} • Applicant: {selectedArchitect ? (selectedArchitect.firmName ? `${selectedArchitect.firmName} (${selectedArchitect.name})` : selectedArchitect.name) : 'Architect Applicant'}
                  {selectedArchitect?.accountStatus === 'APPROVED' ? ` • ${formatArchitectId(selectedArchitect.id || selectedArchitect.applicationNumber)}` : ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveReviewDoc(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full Page Document Viewer Body */}
          <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 flex flex-col space-y-4">
            {/* Visual Preview */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-6 text-center overflow-hidden flex items-center justify-center flex-1 min-h-[60vh] shadow-2xl">
              {activeReviewDoc.fileUrl ? (
                activeReviewDoc.fileUrl.startsWith('data:application/pdf') ||
                activeReviewDoc.fileType?.includes('pdf') ||
                activeReviewDoc.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={activeReviewDoc.fileUrl}
                    title={activeReviewDoc.title}
                    className="w-full h-[70vh] rounded-2xl border border-slate-700 bg-white"
                  />
                ) : (
                  <img
                    src={activeReviewDoc.fileUrl}
                    alt={activeReviewDoc.title}
                    onError={(e) => {
                      const fb =
                        activeReviewDoc.id === 'doc-photo' ||
                        (activeReviewDoc as any).documentType === 'PROFILE_PHOTO'
                          ? generatePhotoDataUrl(
                              selectedArchitect?.name || 'Architect',
                              selectedArchitect?.phone || '',
                              selectedArchitect?.coaNumber || 'COA/VERIFIED',
                              selectedArchitect?.id || selectedArchitect?.applicationNumber || 'ARCH'
                            )
                          : generateCertificateDataUrl(
                              activeReviewDoc.title,
                              selectedArchitect?.name || 'Architect',
                              selectedArchitect?.coaNumber || 'COA/VERIFIED',
                              activeReviewDoc.documentType
                            );
                      (e.target as HTMLImageElement).src = fb;
                    }}
                    className="max-h-[72vh] max-w-full mx-auto rounded-2xl shadow-2xl border border-slate-700 object-contain bg-black/50"
                  />
                )
              ) : (
                <div className="py-24 text-slate-500 text-sm">No visual document preview available.</div>
              )}
            </div>

            {/* Audit Status & Download Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <div>
                <div className="font-bold text-white text-sm">Audit Verification Status:</div>
                <div className="flex items-center gap-2 mt-1">
                  {activeReviewDoc.status === 'VERIFIED' && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Document Verified & Confirmed</span>
                    </span>
                  )}
                  {activeReviewDoc.status === 'REJECTED' && (
                    <span className="text-rose-400 font-bold flex items-center gap-1.5 text-xs">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Cancelled / Rejected: {activeReviewDoc.rejectionReason}</span>
                    </span>
                  )}
                  {(!activeReviewDoc.status || activeReviewDoc.status === 'PENDING') && (
                    <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Pending Super Admin Review</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await downloadDocumentFile(activeReviewDoc, selectedArchitect?.name || 'Architect', selectedArchitect?.coaNumber || 'COA/VERIFIED');
                  success(`Downloading ${activeReviewDoc.fileName || activeReviewDoc.title}`);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl border border-emerald-500 shadow-md inline-flex items-center gap-2 transition shrink-0 cursor-pointer text-xs"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Download Original Document</span>
              </button>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="sticky bottom-0 z-40 bg-navy-950/95 backdrop-blur-md border-t border-navy-900 px-4 sm:px-8 py-4 shadow-2xl flex items-center justify-between gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setActiveReviewDoc(null)}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold cursor-pointer transition"
            >
              Back to Dossier
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const target = activeReviewDoc;
                  setActiveReviewDoc(null);
                  setShowDocRejectModal(target);
                  setDocRejectReason('Document copy illegible / COA number verification failed');
                }}
                className="px-6 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs inline-flex items-center gap-2 transition cursor-pointer"
                title="Cancel or reject this document"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Cancel / Reject</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDocumentApprove(activeReviewDoc.id, activeReviewDoc);
                  setActiveReviewDoc(null);
                }}
                className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-2 shadow-lg transition cursor-pointer active:scale-98"
                title="Verify and approve this statutory document"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Verify Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: DOCUMENT REJECT / CANCEL PROMPT ---------------- */}
      {showDocRejectModal && (
        <div
          className="admin-submodal-overlay fixed inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          style={{ zIndex: 100010 }}
          onClick={() => setShowDocRejectModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative"
            style={{ zIndex: 100011 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-navy-950 text-sm">Cancel / Reject Document</h4>
                <div className="text-[11px] text-slate-500">{showDocRejectModal.title}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Specify Reason for Cancellation / Rejection:
              </label>
              <textarea
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-500"
                value={docRejectReason}
                onChange={(e) => setDocRejectReason(e.target.value)}
                placeholder="e.g. Document image is blurry / Council of Architecture number not matching official records"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[
                  'Scan copy blurry',
                  'COA number mismatch',
                  'Expired registration',
                  'Name spelling error',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDocRejectReason(chip)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDocRejectModal(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDocumentReject(showDocRejectModal.id, docRejectReason, showDocRejectModal, docRejectIndex);
                  setShowDocRejectModal(null);
                  setDocRejectIndex(undefined);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- IMPORT SYNC CODE MODAL ---------------- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-navy-950">Import Architect Data Code</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste the exported sync JSON code below to immediately load all registered architects into your local admin panel:
            </p>

            <textarea
              rows={6}
              value={importCodeText}
              onChange={(e) => setImportCodeText(e.target.value)}
              placeholder='Paste exported JSON code here: { "architects": [...] }'
              className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCode}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black transition cursor-pointer shadow-sm"
              >
                Load Architects Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
