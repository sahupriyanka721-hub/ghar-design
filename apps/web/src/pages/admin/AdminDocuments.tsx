import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Compass,
  Palette,
  Eye,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  Download,
  Share2,
  Maximize2,
  ShieldCheck,
  FileCheck2,
  RotateCcw,
  Sparkles,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  Sliders,
  FolderDown,
  Info,
  Send,
  MessageSquare,
  AlertCircle,
  FileCode,
  History,
  Upload,
  Calculator,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { formatDate } from '../../lib/utils.js';
import {
  getArchitectDesigns,
  saveArchitectDesign,
  adminApproveAndForwardDesign,
  adminRequestDesignRevision,
  adminRejectDesign,
  adminForwardCustomerRevisionToArchitect,
  adminUploadOfficialDocument,
  addDesignVersion,
  updateArchitectDesignStatus,
  ArchitecturalDesign,
  DesignCategory,
  DesignStatus,
  DesignVersionItem,
} from '../../data/architectPanelStore.js';
import {
  getInteriorDesignAssets,
  adminApproveAndForwardInteriorDesign,
  adminRequestInteriorDesignRevision,
  adminRejectInteriorDesign,
  adminForwardCustomerRevisionToInteriorDesigner,
  InteriorDesignAsset,
  InteriorDesignCategory,
} from '../../data/interiorDesignerStore.js';
import { getExecutionProjects, ExecutionProject } from '../../data/projectExecutionStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';
import { pushToCloud } from '../../data/cloudSync.js';

type DocumentStatusFilter = 'ALL' | 'PENDING_REVIEW' | 'FORWARDED' | 'APPROVED' | 'REVISION' | 'REJECTED';

export type DocumentSubView =
  | 'SUBMISSIONS'
  | 'FLOOR_PLANS'
  | 'HOUSE_MAPS'
  | '2D_DRAWINGS'
  | '3D_DESIGNS'
  | 'ELEVATIONS'
  | 'WORKING_DRAWINGS'
  | 'BOQ'
  | 'APPROVAL_REQUESTS'
  | 'REVISIONS'
  | 'APPROVED'
  | 'REJECTED'
  | 'VERSION_HISTORY';

export const SUB_VIEWS: Array<{ key: DocumentSubView; label: string; icon: any; countKey: string }> = [
  { key: 'SUBMISSIONS', label: '1. Architect Design Submissions', icon: FileCheck2, countKey: 'submissions' },
  { key: 'FLOOR_PLANS', label: '2. Floor Plans', icon: Compass, countKey: 'floorPlans' },
  { key: 'HOUSE_MAPS', label: '3. House Maps', icon: MapPin, countKey: 'houseMaps' },
  { key: '2D_DRAWINGS', label: '4. 2D Drawings', icon: Layers, countKey: 'drawings2D' },
  { key: '3D_DESIGNS', label: '5. 3D Designs', icon: Sparkles, countKey: 'designs3D' },
  { key: 'ELEVATIONS', label: '6. Elevation Designs', icon: Building, countKey: 'elevations' },
  { key: 'WORKING_DRAWINGS', label: '7. Working Drawings', icon: FileCode, countKey: 'workingDrawings' },
  { key: 'BOQ', label: '8. BOQ Documents', icon: Calculator, countKey: 'boq' },
  { key: 'APPROVAL_REQUESTS', label: '9. Design Approval Requests', icon: Clock, countKey: 'approvalRequests' },
  { key: 'REVISIONS', label: '10. Revision Requests', icon: RotateCcw, countKey: 'revisions' },
  { key: 'APPROVED', label: '11. Approved Documents', icon: CheckCircle2, countKey: 'approved' },
  { key: 'REJECTED', label: '12. Rejected Documents', icon: AlertTriangle, countKey: 'rejected' },
  { key: 'VERSION_HISTORY', label: '13. Document Version History', icon: History, countKey: 'versions' },
];

export const AdminDocuments: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = (searchParams.get('view') as DocumentSubView) || 'SUBMISSIONS';
  const [selectedView, setSelectedView] = useState<DocumentSubView>(urlView);

  useEffect(() => {
    const v = searchParams.get('view') as DocumentSubView;
    if (v && v !== selectedView) {
      setSelectedView(v);
    }
  }, [searchParams]);

  const handleSelectView = (view: DocumentSubView) => {
    setSelectedView(view);
    setSearchParams({ view });
  };

  const [activeStatusTab, setActiveStatusTab] = useState<DocumentStatusFilter>('ALL');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Inspection Drawer
  const [selectedDesign, setSelectedDesign] = useState<ArchitecturalDesign | null>(null);
  const [inspectedVersion, setInspectedVersion] = useState<DesignVersionItem | null>(null);
  const [zoomPreview, setZoomPreview] = useState(false);

  // Action Modals
  const [revisionModalDesign, setRevisionModalDesign] = useState<ArchitecturalDesign | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  const [rejectModalDesign, setRejectModalDesign] = useState<ArchitecturalDesign | null>(null);
  const [rejectReason, setRejectReason] = useState('Setback violation under NBC 2016 norms');
  const [rejectCustomNotes, setRejectCustomNotes] = useState('');

  // Upload New Version Modal
  const [versionModalDesign, setVersionModalDesign] = useState<ArchitecturalDesign | null>(null);
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [newVersionFileUrl, setNewVersionFileUrl] = useState('');
  const [newVersionFileName, setNewVersionFileName] = useState('');
  const [newVersionFileSize, setNewVersionFileSize] = useState('4.2 MB');

  const [forwardCustomerRevisionDesign, setForwardCustomerRevisionDesign] = useState<ArchitecturalDesign | null>(null);
  const [adminForwardInstructions, setAdminForwardInstructions] = useState('');

  const [approveHandoverNotes, setApproveHandoverNotes] = useState('');

  // Upload Official Document Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DesignCategory>('MUNICIPAL_SANCTION');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadVersion, setUploadVersion] = useState('v1.0');

  // Load designs & execution projects
  const designs = useMemo(() => getArchitectDesigns(), [refreshKey]);
  const projects = useMemo(() => getExecutionProjects(), [refreshKey]);

  // Section 10 Executive Counters
  const counts = useMemo(() => {
    return {
      all: designs.length,
      pending: designs.filter((d) => d.status === 'SUBMITTED_TO_ADMIN').length,
      forwarded: designs.filter((d) => d.status === 'FORWARDED_TO_CUSTOMER' || d.status === 'PENDING_CUSTOMER_APPROVAL').length,
      approved: designs.filter((d) => d.status === 'APPROVED' || d.status === 'CUSTOMER_APPROVED' || d.status === 'ADMIN_APPROVED').length,
      revision: designs.filter((d) => d.status === 'REVISION_REQUESTED' || d.status === 'CUSTOMER_REVISION_REQUESTED').length,
      rejected: designs.filter((d) => d.status === 'REJECTED').length,
    };
  }, [designs]);

  // Module 8 Sub-Views Live Counters
  const subCounts = useMemo(() => {
    const isFloorPlan = (d: ArchitecturalDesign) =>
      ['HOUSE_MAP', 'FLOOR_PLAN_GROUND', 'FLOOR_PLAN_FIRST', 'FLOOR_PLAN_MULTI'].includes(d.category) ||
      d.title.toLowerCase().includes('floor plan');
    const isHouseMap = (d: ArchitecturalDesign) =>
      ['HOUSE_MAP', 'MUNICIPAL_SANCTION', 'SITE_LAYOUT'].includes(d.category) ||
      d.title.toLowerCase().includes('house map') ||
      d.title.toLowerCase().includes('site plan');
    const is2DDrawing = (d: ArchitecturalDesign) =>
      ['DRAWING_2D', 'SECTION_DRAWINGS', 'RENOVATION_DRAWING'].includes(d.category) ||
      d.title.toLowerCase().includes('2d') ||
      d.title.toLowerCase().includes('section');
    const is3DDesign = (d: ArchitecturalDesign) =>
      d.category === 'ELEVATION_3D' ||
      d.fileType === 'PNG' ||
      d.fileType === 'JPG' ||
      d.title.toLowerCase().includes('3d') ||
      d.title.toLowerCase().includes('render');
    const isElevation = (d: ArchitecturalDesign) =>
      d.category === 'ELEVATION_3D' ||
      d.title.toLowerCase().includes('elevation') ||
      d.title.toLowerCase().includes('facade');
    const isWorkingDrawing = (d: ArchitecturalDesign) =>
      ['WORKING_DRAWINGS', 'STRUCTURAL_COORDINATION'].includes(d.category) ||
      d.title.toLowerCase().includes('working') ||
      d.title.toLowerCase().includes('mep') ||
      d.title.toLowerCase().includes('structural') ||
      d.title.toLowerCase().includes('column');
    const isBOQ = (d: ArchitecturalDesign) =>
      d.category === 'BOQ_SPEC' ||
      d.title.toLowerCase().includes('boq') ||
      d.title.toLowerCase().includes('finishes') ||
      d.title.toLowerCase().includes('estimate') ||
      d.title.toLowerCase().includes('quantity');
    const isApprovalReq = (d: ArchitecturalDesign) =>
      d.status === 'SUBMITTED_TO_ADMIN' ||
      d.status === 'PENDING_CUSTOMER_APPROVAL' ||
      d.status === 'FORWARDED_TO_CUSTOMER';
    const isRevision = (d: ArchitecturalDesign) =>
      d.status === 'REVISION_REQUESTED' ||
      d.status === 'CUSTOMER_REVISION_REQUESTED';
    const isApproved = (d: ArchitecturalDesign) =>
      d.status === 'APPROVED' ||
      d.status === 'CUSTOMER_APPROVED' ||
      d.status === 'ADMIN_APPROVED' ||
      d.isLatestApproved;
    const isRejected = (d: ArchitecturalDesign) =>
      d.status === 'REJECTED';

    let totalVersions = 0;
    designs.forEach((d) => {
      totalVersions += d.versions && d.versions.length > 0 ? d.versions.length : 1;
    });

    return {
      submissions: designs.length,
      floorPlans: designs.filter(isFloorPlan).length,
      houseMaps: designs.filter(isHouseMap).length,
      drawings2D: designs.filter(is2DDrawing).length,
      designs3D: designs.filter(is3DDesign).length,
      elevations: designs.filter(isElevation).length,
      workingDrawings: designs.filter(isWorkingDrawing).length,
      boq: designs.filter(isBOQ).length,
      approvalRequests: designs.filter(isApprovalReq).length,
      revisions: designs.filter(isRevision).length,
      approved: designs.filter(isApproved).length,
      rejected: designs.filter(isRejected).length,
      versions: totalVersions,
    };
  }, [designs]);

  // Flattened Document Version History across all architectural designs
  const allVersionHistory = useMemo(() => {
    const list: Array<{
      id: string;
      versionNumber: string;
      fileUrl: string;
      fileName: string;
      fileSize: string;
      uploadedAt: string;
      revisionNotes?: string;
      status?: string;
      customerComments?: string;
      adminReviewNotes?: string;
      parentDesign: ArchitecturalDesign;
    }> = [];

    designs.forEach((d) => {
      if (d.versions && d.versions.length > 0) {
        d.versions.forEach((v) => {
          list.push({
            id: `${d.id}-${v.versionNumber}`,
            versionNumber: v.versionNumber,
            fileUrl: v.fileUrl,
            fileName: v.fileName,
            fileSize: v.fileSize,
            uploadedAt: v.uploadedAt,
            revisionNotes: v.revisionNotes,
            status: v.status || d.status,
            customerComments: v.customerComments || d.customerComments,
            adminReviewNotes: v.adminReviewNotes || d.adminReviewNotes,
            parentDesign: d,
          });
        });
      } else {
        list.push({
          id: `${d.id}-${d.currentVersion}`,
          versionNumber: d.currentVersion,
          fileUrl: d.fileUrl,
          fileName: d.fileName,
          fileSize: d.fileSize,
          uploadedAt: d.uploadedAt,
          revisionNotes: d.revisionNotes,
          status: d.status,
          customerComments: d.customerComments,
          adminReviewNotes: d.adminReviewNotes,
          parentDesign: d,
        });
      }
    });

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (item) =>
        item.fileName.toLowerCase().includes(q) ||
        item.parentDesign.title.toLowerCase().includes(q) ||
        item.parentDesign.projectId.toLowerCase().includes(q) ||
        item.parentDesign.customerName.toLowerCase().includes(q) ||
        (item.parentDesign.architectName && item.parentDesign.architectName.toLowerCase().includes(q)) ||
        item.versionNumber.toLowerCase().includes(q) ||
        (item.revisionNotes && item.revisionNotes.toLowerCase().includes(q))
    );
  }, [designs, search]);

  // Filtered designs
  const filteredDesigns = useMemo(() => {
    return designs.filter((d) => {
      // 1. Search Query
      const query = search.toLowerCase();
      const matchSearch =
        d.title.toLowerCase().includes(query) ||
        d.projectId.toLowerCase().includes(query) ||
        d.customerName.toLowerCase().includes(query) ||
        (d.architectName && d.architectName.toLowerCase().includes(query)) ||
        (d.architectFirm && d.architectFirm.toLowerCase().includes(query)) ||
        d.fileName.toLowerCase().includes(query);

      if (!matchSearch) return false;

      // 2. Sub-View Filtering
      if (selectedView === 'SUBMISSIONS') {
        // All submissions
      } else if (selectedView === 'FLOOR_PLANS') {
        if (!['HOUSE_MAP', 'FLOOR_PLAN_GROUND', 'FLOOR_PLAN_FIRST', 'FLOOR_PLAN_MULTI'].includes(d.category) && !d.title.toLowerCase().includes('floor plan')) return false;
      } else if (selectedView === 'HOUSE_MAPS') {
        if (!['HOUSE_MAP', 'MUNICIPAL_SANCTION', 'SITE_LAYOUT'].includes(d.category) && !d.title.toLowerCase().includes('house map') && !d.title.toLowerCase().includes('site plan')) return false;
      } else if (selectedView === '2D_DRAWINGS') {
        if (!['DRAWING_2D', 'SECTION_DRAWINGS', 'RENOVATION_DRAWING'].includes(d.category) && !d.title.toLowerCase().includes('2d') && !d.title.toLowerCase().includes('section')) return false;
      } else if (selectedView === '3D_DESIGNS') {
        if (d.category !== 'ELEVATION_3D' && d.fileType !== 'PNG' && d.fileType !== 'JPG' && !d.title.toLowerCase().includes('3d') && !d.title.toLowerCase().includes('render')) return false;
      } else if (selectedView === 'ELEVATIONS') {
        if (d.category !== 'ELEVATION_3D' && !d.title.toLowerCase().includes('elevation') && !d.title.toLowerCase().includes('facade')) return false;
      } else if (selectedView === 'WORKING_DRAWINGS') {
        if (!['WORKING_DRAWINGS', 'STRUCTURAL_COORDINATION'].includes(d.category) && !d.title.toLowerCase().includes('working') && !d.title.toLowerCase().includes('mep') && !d.title.toLowerCase().includes('structural') && !d.title.toLowerCase().includes('column')) return false;
      } else if (selectedView === 'BOQ') {
        if (d.category !== 'BOQ_SPEC' && !d.title.toLowerCase().includes('boq') && !d.title.toLowerCase().includes('finishes') && !d.title.toLowerCase().includes('estimate') && !d.title.toLowerCase().includes('quantity')) return false;
      } else if (selectedView === 'APPROVAL_REQUESTS') {
        if (d.status !== 'SUBMITTED_TO_ADMIN' && d.status !== 'PENDING_CUSTOMER_APPROVAL' && d.status !== 'FORWARDED_TO_CUSTOMER') return false;
      } else if (selectedView === 'REVISIONS') {
        if (d.status !== 'REVISION_REQUESTED' && d.status !== 'CUSTOMER_REVISION_REQUESTED') return false;
      } else if (selectedView === 'APPROVED') {
        if (d.status !== 'APPROVED' && d.status !== 'CUSTOMER_APPROVED' && d.status !== 'ADMIN_APPROVED' && !d.isLatestApproved) return false;
      } else if (selectedView === 'REJECTED') {
        if (d.status !== 'REJECTED') return false;
      }

      // 3. Status Tab
      if (activeStatusTab === 'PENDING_REVIEW' && d.status !== 'SUBMITTED_TO_ADMIN') return false;
      if (
        activeStatusTab === 'FORWARDED' &&
        d.status !== 'FORWARDED_TO_CUSTOMER' &&
        d.status !== 'PENDING_CUSTOMER_APPROVAL'
      )
        return false;
      if (
        activeStatusTab === 'APPROVED' &&
        d.status !== 'APPROVED' &&
        d.status !== 'CUSTOMER_APPROVED' &&
        d.status !== 'ADMIN_APPROVED'
      )
        return false;
      if (
        activeStatusTab === 'REVISION' &&
        d.status !== 'REVISION_REQUESTED' &&
        d.status !== 'CUSTOMER_REVISION_REQUESTED'
      )
        return false;
      if (activeStatusTab === 'REJECTED' && d.status !== 'REJECTED') return false;

      // 4. Category Filter
      if (activeCategoryFilter !== 'ALL') {
        if (activeCategoryFilter === 'FLOOR_PLAN') {
          if (!['HOUSE_MAP', 'FLOOR_PLAN_GROUND', 'FLOOR_PLAN_FIRST', 'FLOOR_PLAN_MULTI'].includes(d.category))
            return false;
        } else if (activeCategoryFilter === 'ELEVATION_3D') {
          if (d.category !== 'ELEVATION_3D') return false;
        } else if (activeCategoryFilter === 'DRAWING_2D') {
          if (!['DRAWING_2D', 'SECTION_DRAWINGS', 'SITE_LAYOUT'].includes(d.category)) return false;
        } else if (activeCategoryFilter === 'STRUCTURAL') {
          if (d.category !== 'STRUCTURAL_COORDINATION') return false;
        } else if (activeCategoryFilter === 'WORKING_DRAWINGS') {
          if (d.category !== 'WORKING_DRAWINGS') return false;
        } else if (activeCategoryFilter === 'BOQ_SPEC') {
          if (d.category !== 'BOQ_SPEC') return false;
        } else if (activeCategoryFilter === 'MUNICIPAL_SANCTION') {
          if (d.category !== 'MUNICIPAL_SANCTION') return false;
        }
      }

      return true;
    });
  }, [designs, search, selectedView, activeStatusTab, activeCategoryFilter]);

  // Section 10 Action: Direct Quick Approve
  const handleQuickApprove = (design: ArchitecturalDesign) => {
    const updated = updateArchitectDesignStatus(design.id, 'APPROVED', 'Technical and statutory compliance audit approved.');
    if (updated) {
      logAdminAuditAction({
        action: 'APPROVE_DESIGN_DIRECT',
        module: 'DOCUMENT_MANAGEMENT',
        entity: `${updated.title} (${updated.currentVersion})`,
        details: `Directly approved document ${updated.id} for project ${updated.projectId}. Ready for site execution.`,
      });
      pushToCloud().catch(() => {});
      success(`Document ${updated.title} (${updated.currentVersion}) marked as APPROVED!`);
      if (selectedDesign?.id === updated.id) {
        setSelectedDesign(updated);
      }
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 10 Action: Reopen Rejected Submission
  const handleReopenSubmission = (design: ArchitecturalDesign) => {
    const updated = updateArchitectDesignStatus(design.id, 'SUBMITTED_TO_ADMIN', 'Reopened by Admin Desk for reconsideration.');
    if (updated) {
      logAdminAuditAction({
        action: 'REOPEN_DESIGN_SUBMISSION',
        module: 'DOCUMENT_MANAGEMENT',
        entity: `${updated.title} (${updated.currentVersion})`,
        details: `Reopened rejected document ${updated.id} into active review queue.`,
      });
      pushToCloud().catch(() => {});
      success(`Document ${updated.title} reopened and returned to active review queue!`);
      if (selectedDesign?.id === updated.id) {
        setSelectedDesign(updated);
      }
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 10 Action: Upload New Version
  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionModalDesign) return;

    const updated = addDesignVersion(versionModalDesign.id, {
      fileUrl: newVersionFileUrl.trim() || versionModalDesign.fileUrl,
      fileName: newVersionFileName.trim() || `${versionModalDesign.title.replace(/\s+/g, '_')}_vNext.pdf`,
      fileSize: newVersionFileSize || '3.5 MB',
      revisionNotes: newVersionNotes.trim() || 'Revised version submitted per redline markups.',
    });

    if (updated) {
      logAdminAuditAction({
        action: 'ADD_DESIGN_VERSION',
        module: 'DOCUMENT_MANAGEMENT',
        entity: `${updated.title} (${updated.currentVersion})`,
        details: `Created new version ${updated.currentVersion} for design ${updated.id}. Changelog: ${newVersionNotes.trim()}`,
      });
      pushToCloud().catch(() => {});
      success(`New version ${updated.currentVersion} published for ${updated.title}!`);
      if (selectedDesign?.id === updated.id) {
        setSelectedDesign(updated);
      }
      setVersionModalDesign(null);
      setNewVersionNotes('');
      setNewVersionFileUrl('');
      setNewVersionFileName('');
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 10 Action: Confirm Technical Rejection
  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalDesign) return;
    const combinedReason = `${rejectReason}${rejectCustomNotes.trim() ? `. Details: ${rejectCustomNotes.trim()}` : ''}`;
    const updated = adminRejectDesign(rejectModalDesign.id, combinedReason);
    if (updated) {
      logAdminAuditAction({
        action: 'REJECT_DESIGN_SUBMISSION',
        module: 'DOCUMENT_MANAGEMENT',
        entity: `${updated.title} (${updated.currentVersion})`,
        details: `Rejected submission ${updated.id}. Reason: ${combinedReason}`,
      });
      pushToCloud().catch(() => {});
      success(`Design submission ${updated.title} marked as REJECTED.`);
      if (selectedDesign?.id === updated.id) {
        setSelectedDesign(updated);
      }
      setRejectModalDesign(null);
      setRejectCustomNotes('');
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 10 Action: Approve & Forward to Customer
  const handleApproveAndForward = (design: ArchitecturalDesign, customNotes?: string) => {
    const updated = adminApproveAndForwardDesign(design.id, {
      adminNotes: customNotes || approveHandoverNotes || 'Technical compliance audit cleared by Admin Desk.',
    });

    if (updated) {
      logAdminAuditAction({
        action: 'APPROVE_AND_FORWARD_DESIGN',
        module: 'DOCUMENT_MANAGEMENT',
        entity: `${updated.title} (${updated.currentVersion})`,
        details: `Approved design ${updated.id} for project ${updated.projectId} and forwarded to homeowner ${updated.customerName}.`,
      });
      pushToCloud().catch(() => {});
      success(`Design ${updated.title} (${updated.currentVersion}) approved and forwarded to homeowner!`);
      setSelectedDesign(updated);
      setApproveHandoverNotes('');
      setRefreshKey((k) => k + 1);
    } else {
      error('Failed to forward design.');
    }
  };

  // Section 10 Action: Request Revision from Architect
  const handleConfirmRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalDesign || !revisionNotes.trim()) {
      error('Please specify the revision redline comments.');
      return;
    }

    const updated = adminRequestDesignRevision(revisionModalDesign.id, {
      revisionNotes: revisionNotes.trim(),
    });

    if (updated) {
      logAdminAuditAction({
        action: 'REQUEST_DESIGN_REVISION',
        module: 'DOCUMENT_MANAGEMENT',
        entity: `${updated.title} (${updated.currentVersion})`,
        details: `Requested technical revision on ${updated.id} from architect ${updated.architectName || 'partner'}. Redline notes: ${revisionNotes.trim()}`,
      });
      pushToCloud().catch(() => {});
      success(`Revision requested from architect for ${updated.title}. Architect studio notified.`);
      if (selectedDesign?.id === updated.id) {
        setSelectedDesign(updated);
      }
      setRevisionModalDesign(null);
      setRevisionNotes('');
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 10 Action: Forward Customer's Changes to Architect
  const handleConfirmForwardCustomerRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardCustomerRevisionDesign) return;

    const updated = adminForwardCustomerRevisionToArchitect(
      forwardCustomerRevisionDesign.id,
      adminForwardInstructions.trim()
    );

    if (updated) {
      logAdminAuditAction({
        action: 'FORWARD_CUSTOMER_REVISION_TO_ARCHITECT',
        module: 'DOCUMENT_MANAGEMENT',
        entity: `${updated.title} (${updated.currentVersion})`,
        details: `Forwarded client change requests to architect ${updated.architectName}. Admin directives: ${adminForwardInstructions.trim()}`,
      });
      pushToCloud().catch(() => {});
      success(`Client revision feedback forwarded to architect studio.`);
      if (selectedDesign?.id === updated.id) {
        setSelectedDesign(updated);
      }
      setForwardCustomerRevisionDesign(null);
      setAdminForwardInstructions('');
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 10 Action: Reject Submission
  const handleRejectSubmission = (design: ArchitecturalDesign) => {
    const reason = window.prompt('Enter reason for rejecting this technical submission:');
    if (!reason || !reason.trim()) return;

    const updated = adminRejectDesign(design.id, reason.trim());
    if (updated) {
      logAdminAuditAction({
        action: 'REJECT_DESIGN_SUBMISSION',
        module: 'DOCUMENT_MANAGEMENT',
        entity: `${updated.title} (${updated.currentVersion})`,
        details: `Rejected submission ${updated.id}. Reason: ${reason.trim()}`,
      });
      pushToCloud().catch(() => {});
      success(`Design submission ${updated.title} rejected.`);
      if (selectedDesign?.id === updated.id) {
        setSelectedDesign(updated);
      }
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 10 Action: Upload Official Document
  const handleCreateOfficialDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadProjectId || !uploadTitle.trim()) {
      error('Please select a project and enter the document title.');
      return;
    }

    const prj = projects.find((p) => p.id === uploadProjectId);
    const newDoc = adminUploadOfficialDocument({
      projectId: uploadProjectId,
      projectTitle: prj?.name || `Project ${uploadProjectId}`,
      customerName: prj?.customerName || 'Homeowner Client',
      category: uploadCategory,
      title: uploadTitle.trim(),
      description: uploadDescription.trim(),
      fileUrl: uploadFileUrl || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      fileName: uploadFileName.trim() || `${uploadTitle.trim().replace(/\s+/g, '_')}_v1.0.pdf`,
      version: uploadVersion || 'v1.0',
    });

    logAdminAuditAction({
      action: 'UPLOAD_OFFICIAL_DOCUMENT',
      module: 'DOCUMENT_MANAGEMENT',
      entity: `${newDoc.title} (${newDoc.currentVersion})`,
      details: `Admin directly uploaded official ${newDoc.category} document for project ${newDoc.projectId}.`,
    });
    pushToCloud().catch(() => {});

    success(`Official document ${newDoc.title} uploaded and attached to ${newDoc.projectId}!`);
    setShowUploadModal(false);
    setUploadProjectId('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadFileUrl('');
    setUploadFileName('');
    setRefreshKey((k) => k + 1);
  };

  // Section 9F Interior Designer Discipline State
  const [discipline, setDiscipline] = useState<'ARCHITECTURAL' | 'INTERIOR'>('ARCHITECTURAL');
  const [selectedInteriorAsset, setSelectedInteriorAsset] = useState<InteriorDesignAsset | null>(null);
  const [interiorActionModal, setInteriorActionModal] = useState<{
    type: 'APPROVE' | 'REVISE' | 'REJECT' | 'FORWARD_CUSTOMER_REVISION' | null;
    asset: InteriorDesignAsset | null;
    notes: string;
  }>({ type: null, asset: null, notes: '' });

  const interiorAssets = useMemo(() => getInteriorDesignAssets(), [refreshKey]);

  const interiorCounts = useMemo(() => {
    return {
      all: interiorAssets.length,
      pending: interiorAssets.filter((a) => a.adminReviewStatus === 'PENDING_ADMIN_REVIEW').length,
      forwarded: interiorAssets.filter((a) => a.forwardedToCustomer && a.clientApprovalStatus !== 'APPROVED').length,
      customerRevision: interiorAssets.filter(
        (a) => a.adminReviewStatus === 'CUSTOMER_REVISION_PENDING_ADMIN_FORWARD' || a.clientApprovalStatus === 'CHANGES_REQUESTED'
      ).length,
      approved: interiorAssets.filter((a) => a.clientApprovalStatus === 'APPROVED' || a.isLatestApproved).length,
      revision: interiorAssets.filter((a) => a.adminReviewStatus === 'REVISION_REQUESTED').length,
      rejected: interiorAssets.filter((a) => a.adminReviewStatus === 'REJECTED').length,
    };
  }, [interiorAssets]);

  const filteredInteriorAssets = useMemo(() => {
    return interiorAssets.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        a.title.toLowerCase().includes(q) ||
        a.documentId.toLowerCase().includes(q) ||
        a.projectId.toLowerCase().includes(q) ||
        a.roomName.toLowerCase().includes(q) ||
        (a.uploadedBy && a.uploadedBy.toLowerCase().includes(q)) ||
        (a.projectName && a.projectName.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (activeStatusTab === 'PENDING_REVIEW' && a.adminReviewStatus !== 'PENDING_ADMIN_REVIEW') return false;
      if (activeStatusTab === 'FORWARDED' && (!a.forwardedToCustomer || a.clientApprovalStatus === 'APPROVED')) return false;
      if (activeStatusTab === 'APPROVED' && a.clientApprovalStatus !== 'APPROVED' && !a.isLatestApproved) return false;
      if (
        activeStatusTab === 'REVISION' &&
        a.adminReviewStatus !== 'REVISION_REQUESTED' &&
        a.adminReviewStatus !== 'CUSTOMER_REVISION_PENDING_ADMIN_FORWARD'
      )
        return false;
      if (activeStatusTab === 'REJECTED' && a.adminReviewStatus !== 'REJECTED') return false;

      if (activeCategoryFilter !== 'ALL' && a.category !== activeCategoryFilter) return false;

      return true;
    });
  }, [interiorAssets, search, activeStatusTab, activeCategoryFilter]);

  const handleApproveInteriorAsset = (asset: InteriorDesignAsset, notes?: string) => {
    const updated = adminApproveAndForwardInteriorDesign(
      asset.id,
      notes || 'Technical and aesthetic compliance audit verified by Admin Desk.'
    );
    logAdminAuditAction({
      action: 'APPROVE_AND_FORWARD_DESIGN',
      module: 'DOCUMENT_MANAGEMENT',
      entity: `${updated.title} (${updated.version})`,
      details: `Admin approved interior design ${updated.documentId} and forwarded to homeowner for project ${updated.projectId}.`,
    });
    pushToCloud().catch(() => {});
    success(`Interior design ${updated.documentId} (${updated.version}) approved & forwarded to homeowner!`);
    setSelectedInteriorAsset(updated);
    setInteriorActionModal({ type: null, asset: null, notes: '' });
    setRefreshKey((k) => k + 1);
  };

  const handleRequestInteriorRevision = (asset: InteriorDesignAsset, notes: string) => {
    if (!notes.trim()) {
      error('Please specify redline comments for the interior designer.');
      return;
    }
    const updated = adminRequestInteriorDesignRevision(asset.id, notes.trim());
    logAdminAuditAction({
      action: 'REQUEST_DESIGN_REVISION',
      module: 'DOCUMENT_MANAGEMENT',
      entity: `${updated.title} (${updated.version})`,
      details: `Admin requested revision on interior design ${updated.documentId}. Notes: ${notes.trim()}`,
    });
    pushToCloud().catch(() => {});
    success(`Revision requested from interior designer for ${updated.documentId}. Designer studio notified.`);
    setSelectedInteriorAsset(updated);
    setInteriorActionModal({ type: null, asset: null, notes: '' });
    setRefreshKey((k) => k + 1);
  };

  const handleForwardCustomerRevisionToInteriorDesigner = (asset: InteriorDesignAsset, instructions: string) => {
    const updated = adminForwardCustomerRevisionToInteriorDesigner(asset.id, instructions.trim());
    logAdminAuditAction({
      action: 'FORWARD_CUSTOMER_REVISION_TO_ARCHITECT',
      module: 'DOCUMENT_MANAGEMENT',
      entity: `${updated.title} (${updated.version})`,
      details: `Admin forwarded homeowner changes to Interior Designer for ${updated.documentId}. Admin directives: ${instructions.trim()}`,
    });
    pushToCloud().catch(() => {});
    success(`Homeowner revision feedback and Admin instructions forwarded to interior designer.`);
    setSelectedInteriorAsset(updated);
    setInteriorActionModal({ type: null, asset: null, notes: '' });
    setRefreshKey((k) => k + 1);
  };

  const handleRejectInteriorAsset = (asset: InteriorDesignAsset, reason: string) => {
    const updated = adminRejectInteriorDesign(asset.id, reason.trim());
    logAdminAuditAction({
      action: 'REJECT_DESIGN',
      module: 'DOCUMENT_MANAGEMENT',
      entity: `${updated.title} (${updated.version})`,
      details: `Admin rejected interior design ${updated.documentId}. Reason: ${reason.trim()}`,
    });
    pushToCloud().catch(() => {});
    success(`Interior design submission rejected.`);
    setSelectedInteriorAsset(updated);
    setInteriorActionModal({ type: null, asset: null, notes: '' });
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              {discipline === 'INTERIOR' ? 'Interior Design 2D/3D & Finishes Review Desk' : 'Architectural Design & Technical Document Review Desk'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {discipline === 'INTERIOR'
              ? 'Section 9F Multi-Stage Approval Console: Space Planning, 2D Working CAD, 3D Photorealistic Renders, Material Palettes & Client Revisions.'
              : 'Section 10 Master Review Console: Floor Plans, 3D Facades, Structural CAD (IS 456), Working MEP, BOQ & Multi-Version Customer Handover.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setShowUploadModal(true);
              if (projects.length > 0 && !uploadProjectId) {
                setUploadProjectId(projects[0].id);
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:shadow text-xs flex items-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Official Document</span>
          </button>
        </div>
      </div>

      {/* ---------------- MODULE 8: VIEW SWITCHER DROPDOWN & 13-PILL ACTION STRIP ---------------- */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Design &amp; Document Management View (Module 8):
            </span>
          </div>

          {/* Feature Dropdown Selector */}
          <div className="relative w-full sm:w-96">
            <select
              value={selectedView}
              onChange={(e) => handleSelectView(e.target.value as DocumentSubView)}
              className="w-full appearance-none px-3.5 py-2.5 bg-slate-50 border border-slate-300 hover:border-blue-500 text-slate-900 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10"
            >
              <option value="SUBMISSIONS">1. Architect Design Submissions ({subCounts.submissions})</option>
              <option value="FLOOR_PLANS">2. Floor Plans ({subCounts.floorPlans})</option>
              <option value="HOUSE_MAPS">3. House Maps ({subCounts.houseMaps})</option>
              <option value="2D_DRAWINGS">4. 2D Drawings ({subCounts.drawings2D})</option>
              <option value="3D_DESIGNS">5. 3D Designs ({subCounts.designs3D})</option>
              <option value="ELEVATIONS">6. Elevation Designs ({subCounts.elevations})</option>
              <option value="WORKING_DRAWINGS">7. Working Drawings ({subCounts.workingDrawings})</option>
              <option value="BOQ">8. BOQ Documents ({subCounts.boq})</option>
              <option value="APPROVAL_REQUESTS">9. Design Approval Requests ({subCounts.approvalRequests})</option>
              <option value="REVISIONS">10. Revision Requests ({subCounts.revisions})</option>
              <option value="APPROVED">11. Approved Documents ({subCounts.approved})</option>
              <option value="REJECTED">12. Rejected Documents ({subCounts.rejected})</option>
              <option value="VERSION_HISTORY">13. Document Version History ({subCounts.versions})</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 13-Pill Action Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-slate-100">
          {SUB_VIEWS.map((sv) => {
            const isActive = selectedView === sv.key;
            const badgeCount = (subCounts as any)[sv.countKey] || 0;
            const Icon = sv.icon;

            return (
              <button
                key={sv.key}
                type="button"
                onClick={() => handleSelectView(sv.key)}
                className={`flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-blue-600'}`} />
                  <span className="truncate text-[11px]">{sv.label.replace(/^\d+\.\s*/, '')}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {badgeCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discipline Switcher Pill Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDiscipline('ARCHITECTURAL');
              setActiveStatusTab('ALL');
              setActiveCategoryFilter('ALL');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              discipline === 'ARCHITECTURAL'
                ? 'bg-white text-navy-950 shadow-xs'
                : 'text-slate-600 hover:text-navy-950'
            }`}
          >
            <Building className="w-4 h-4 text-blue-600" />
            <span>Architectural &amp; Structural CAD</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 font-mono">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => {
              setDiscipline('INTERIOR');
              setActiveStatusTab('ALL');
              setActiveCategoryFilter('ALL');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              discipline === 'INTERIOR'
                ? 'bg-white text-navy-950 shadow-xs'
                : 'text-slate-600 hover:text-navy-950'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-600" />
            <span>Interior Design Desk (Section 9F)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 text-amber-700 font-mono">
              {interiorCounts.all}
            </span>
            {interiorCounts.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono animate-pulse">
                {interiorCounts.pending} New
              </span>
            )}
            {interiorCounts.customerRevision > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500 text-white font-mono">
                {interiorCounts.customerRevision} Client Rev
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 hidden sm:block pr-2">
          Review Mode: <strong className="text-navy-950">{discipline === 'INTERIOR' ? 'Interior Designer Deliverables' : 'Architectural Deliverables'}</strong>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Submissions</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black font-display text-navy-950 mt-1">
            {discipline === 'INTERIOR' ? interiorCounts.all : counts.all}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            {discipline === 'INTERIOR' ? 'All Interior 2D/3D Assets' : 'All Project Drawings'}
          </span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Admin Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-display text-amber-950 mt-1">
            {discipline === 'INTERIOR' ? interiorCounts.pending : counts.pending}
          </p>
          <span className="text-[10px] text-amber-700 font-bold">Needs Compliance Audit</span>
        </div>

        <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200 shadow-2xs">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Forwarded to Client</span>
            <Send className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black font-display text-sky-950 mt-1">
            {discipline === 'INTERIOR' ? interiorCounts.forwarded : counts.forwarded}
          </p>
          <span className="text-[10px] text-sky-700 font-medium">Awaiting Homeowner Decision</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Client Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-display text-emerald-950 mt-1">
            {discipline === 'INTERIOR' ? interiorCounts.approved : counts.approved}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">Locked for Execution</span>
        </div>

        <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {discipline === 'INTERIOR' && interiorCounts.customerRevision > 0 ? 'Client Change Request' : 'Active Revisions'}
            </span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black font-display text-purple-950 mt-1">
            {discipline === 'INTERIOR' ? interiorCounts.customerRevision || interiorCounts.revision : counts.revision}
          </p>
          <span className="text-[10px] text-purple-700 font-medium">
            {discipline === 'INTERIOR' && interiorCounts.customerRevision > 0 ? 'Requires Admin Routing' : 'Redlines in Progress'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Category Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: 'All Submissions', value: 'ALL', count: discipline === 'INTERIOR' ? interiorCounts.all : counts.all },
              { label: 'Pending Review', value: 'PENDING_REVIEW', count: discipline === 'INTERIOR' ? interiorCounts.pending : counts.pending },
              { label: 'Forwarded to Client', value: 'FORWARDED', count: discipline === 'INTERIOR' ? interiorCounts.forwarded : counts.forwarded },
              { label: 'Client Approved', value: 'APPROVED', count: discipline === 'INTERIOR' ? interiorCounts.approved : counts.approved },
              { label: 'Revisions Active', value: 'REVISION', count: discipline === 'INTERIOR' ? interiorCounts.customerRevision + interiorCounts.revision : counts.revision },
              { label: 'Rejected', value: 'REJECTED', count: discipline === 'INTERIOR' ? interiorCounts.rejected : counts.rejected },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveStatusTab(tab.value as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeStatusTab === tab.value
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeStatusTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={discipline === 'INTERIOR' ? 'Search title, room, doc ID, designer...' : 'Search drawing, project ID, architect...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            {discipline === 'INTERIOR' ? 'Interior Category:' : 'Document Category:'}
          </span>
          {(discipline === 'INTERIOR'
            ? [
                { label: 'All Interior Deliverables', value: 'ALL' },
                { label: '🛋️ 9B. Space Planning (Layouts)', value: 'SPACE_PLANNING' },
                { label: '📐 9C. 2D Working CAD Plans', value: 'LAYOUT_2D' },
                { label: '🎨 9D. 3D Photorealistic Renders', value: 'VISUALIZATION_3D' },
                { label: '🧱 9E. Material & Finish Palettes', value: 'MATERIAL_FINISHES' },
              ]
            : [
                { label: 'All Categories', value: 'ALL' },
                { label: '📐 Floor Plans & House Maps', value: 'FLOOR_PLAN' },
                { label: '🎨 3D Facades & Elevations', value: 'ELEVATION_3D' },
                { label: '📏 2D & Sectional Blueprints', value: 'DRAWING_2D' },
                { label: '🏗️ Structural & Column Grids', value: 'STRUCTURAL' },
                { label: '⚙️ Working Drawings & MEP', value: 'WORKING_DRAWINGS' },
                { label: '📊 BOQ & Cost Estimates', value: 'BOQ_SPEC' },
                { label: '🏛️ Municipal Sanctions', value: 'MUNICIPAL_SANCTION' },
              ]
          ).map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategoryFilter(cat.value)}
              className={`px-3 py-1 rounded-lg font-medium text-[11px] shrink-0 transition ${
                activeCategoryFilter === cat.value
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View-Specific Title & Hint Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              {SUB_VIEWS.find((s) => s.key === selectedView)?.icon &&
                React.createElement(SUB_VIEWS.find((s) => s.key === selectedView)!.icon, { className: 'w-5 h-5' })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black font-display text-navy-950">
                  {SUB_VIEWS.find((s) => s.key === selectedView)?.label}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-600 text-white">
                  {selectedView === 'VERSION_HISTORY' ? `${allVersionHistory.length} Versions` : `${filteredDesigns.length} Drawings`}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {selectedView === 'SUBMISSIONS' && 'Incoming Architect Submissions Desk - Fast-track triage, structural vetting & customer delivery.'}
                {selectedView === 'FLOOR_PLANS' && 'Floor Plans & Space Zoning - Dimensioned room layouts, carpet area calculations & Vaastu compliance.'}
                {selectedView === 'HOUSE_MAPS' && 'House Maps & Municipal Clearances - Setback blueprints, ground coverage % & authority sanction drawings.'}
                {selectedView === '2D_DRAWINGS' && '2D Detailed Architectural Drawings - Cross-sectional profiles, lintel heights & fenestration schedules.'}
                {selectedView === '3D_DESIGNS' && '3D Concept Visualizations - Photorealistic Day & Night exterior/interior renders with zoom inspection.'}
                {selectedView === 'ELEVATIONS' && 'Elevation Designs - Front, corner, side and rear architectural facade treatments & cladding details.'}
                {selectedView === 'WORKING_DRAWINGS' && 'Working Drawings & MEP - Column centerlines, beam ductile detailing (IS 456), plumbing & electrical.'}
                {selectedView === 'BOQ' && 'Bill of Quantities (BOQ) - Itemized cost estimation, civil material schedules and rate sheets.'}
                {selectedView === 'APPROVAL_REQUESTS' && 'Pending Technical Approval Desk - Clear drawings for client delivery with 1-click handover stamp.'}
                {selectedView === 'REVISIONS' && 'Revision Management Desk - Tracking admin/client redlines, turnaround deadlines & re-submissions.'}
                {selectedView === 'APPROVED' && 'Approved Documents Vault - Formally verified, watermarked blueprints locked for site execution.'}
                {selectedView === 'REJECTED' && 'Rejected Drawings Desk - Submissions marked non-compliant with municipal bye-laws or NBC standards.'}
                {selectedView === 'VERSION_HISTORY' && 'Document Version Lineage Console - Full multi-version audit trail (v1.0 to vX.X) across all projects.'}
              </p>
            </div>
          </div>

          {selectedView === 'VERSION_HISTORY' && (
            <button
              onClick={() => {
                if (designs.length > 0) {
                  setVersionModalDesign(designs[0]);
                  setNewVersionFileName(`${designs[0].title.replace(/\s+/g, '_')}_v2.0.pdf`);
                  setNewVersionNotes('');
                }
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Version</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 mt-2">
          {selectedView === 'VERSION_HISTORY' ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Version &amp; File</th>
                  <th className="py-3 px-3">Parent Blueprint</th>
                  <th className="py-3 px-3">Project &amp; Client</th>
                  <th className="py-3 px-3">Architect Partner</th>
                  <th className="py-3 px-3">Uploaded Date</th>
                  <th className="py-3 px-3">Changelog / Redline Remarks</th>
                  <th className="py-3 px-3 text-center">Version Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allVersionHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No version history records found.</p>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        When architects submit revised drafts, the version lineage (v1.0, v1.1, v2.0...) will track here.
                      </span>
                    </td>
                  </tr>
                ) : (
                  allVersionHistory.map((ver) => {
                    const isVApproved =
                      ver.status === 'APPROVED' ||
                      ver.status === 'CUSTOMER_APPROVED' ||
                      ver.status === 'ADMIN_APPROVED';
                    const isVRevision =
                      ver.status === 'REVISION_REQUESTED' ||
                      ver.status === 'CUSTOMER_REVISION_REQUESTED';
                    const isVRejected = ver.status === 'REJECTED';

                    return (
                      <tr key={ver.id} className="hover:bg-slate-50/80 transition">
                        {/* 1. Version & File */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                              {ver.versionNumber}
                            </span>
                            <div>
                              <strong className="text-slate-900 block text-xs">{ver.fileName}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">{ver.fileSize}</span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Parent Blueprint */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]" title={ver.parentDesign.title}>
                              {ver.parentDesign.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-sans font-medium">
                              {ver.parentDesign.category.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>

                        {/* 3. Project & Client */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                              {ver.parentDesign.projectId}
                            </span>
                            <span className="text-[10px] text-slate-600 block">{ver.parentDesign.customerName}</span>
                          </div>
                        </td>

                        {/* 4. Architect Partner */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block">{ver.parentDesign.architectName || 'Lead Architect'}</span>
                            <span className="text-[10px] text-slate-500 block">{ver.parentDesign.architectFirm || 'Studio Partner'}</span>
                          </div>
                        </td>

                        {/* 5. Uploaded Date */}
                        <td className="py-3 px-3">
                          <span className="text-xs text-slate-700 font-mono block">
                            {formatDate(ver.uploadedAt)}
                          </span>
                        </td>

                        {/* 6. Changelog / Remarks */}
                        <td className="py-3 px-3">
                          <div className="max-w-[220px]">
                            <p className="text-[11px] text-slate-700 line-clamp-2">
                              {ver.revisionNotes || ver.customerComments || ver.adminReviewNotes || 'Initial baseline release.'}
                            </p>
                          </div>
                        </td>

                        {/* 7. Version Status */}
                        <td className="py-3 px-3 text-center">
                          {isVApproved ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : isVRevision ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-purple-600" />
                              <span>Revision</span>
                            </span>
                          ) : isVRejected ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-sky-600" />
                              <span>{ver.status || 'Active'}</span>
                            </span>
                          )}
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedDesign(ver.parentDesign);
                                setInspectedVersion({
                                  versionNumber: ver.versionNumber,
                                  fileUrl: ver.fileUrl,
                                  fileName: ver.fileName,
                                  fileSize: ver.fileSize,
                                  uploadedAt: ver.uploadedAt,
                                  revisionNotes: ver.revisionNotes || '',
                                  status: (ver.status as any) || 'FORWARDED_TO_CUSTOMER',
                                });
                              }}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Audit version blueprint"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-600" />
                              <span>Audit</span>
                            </button>

                            <button
                              onClick={() => {
                                setVersionModalDesign(ver.parentDesign);
                                setNewVersionFileName(`${ver.parentDesign.title.replace(/\s+/g, '_')}_v${(parseFloat(ver.versionNumber.replace('v', '')) + 0.1).toFixed(1)}.pdf`);
                                setNewVersionNotes('');
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Upload successor version"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Next Ver</span>
                            </button>

                            {ver.fileUrl && (
                              <a
                                href={ver.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={ver.fileName}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                                title="Download file"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : discipline === 'INTERIOR' ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Interior Deliverable</th>
                  <th className="py-3 px-3">Shared Project ID</th>
                  <th className="py-3 px-3">Interior Designer</th>
                  <th className="py-3 px-3">Room / Space</th>
                  <th className="py-3 px-3 text-center">Version &amp; Audit</th>
                  <th className="py-3 px-3 text-center">Section 9F Status</th>
                  <th className="py-3 px-4 text-right">Admin Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInteriorAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Palette className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No interior design submissions match this filter.</p>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Submissions from Interior Designers route here for technical &amp; aesthetic compliance audit.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredInteriorAssets.map((asset) => {
                    const isPendingAdmin = asset.adminReviewStatus === 'PENDING_ADMIN_REVIEW';
                    const isClientRevision =
                      asset.adminReviewStatus === 'CUSTOMER_REVISION_PENDING_ADMIN_FORWARD' ||
                      asset.clientApprovalStatus === 'CHANGES_REQUESTED';
                    const isApproved = asset.clientApprovalStatus === 'APPROVED' || asset.isLatestApproved;
                    const isForwarded = asset.forwardedToCustomer && asset.clientApprovalStatus !== 'APPROVED';
                    const isRevisionUnderway = asset.adminReviewStatus === 'REVISION_REQUESTED';

                    return (
                      <tr key={asset.id} className="hover:bg-amber-50/20 transition">
                        {/* 1. Interior Deliverable */}
                        <td className="py-3 px-4">
                          <div
                            onClick={() => setSelectedInteriorAsset(asset)}
                            className="cursor-pointer group"
                            title="Click to inspect drawing & audit"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                {asset.documentId}
                              </span>
                              <strong className="text-slate-900 group-hover:text-blue-600 transition-colors block text-xs">
                                {asset.title}
                              </strong>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold font-sans">
                                {asset.category.replace(/_/g, ' ')}
                              </span>
                              <span>{asset.fileSize}</span>
                              {asset.isLatestApproved && (
                                <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                                  LATEST APPROVED
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Shared Project ID */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                              {asset.projectId}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                              {asset.projectName}
                            </span>
                          </div>
                        </td>

                        {/* 3. Interior Designer */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block">{asset.uploadedBy}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {new Date(asset.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        {/* 4. Room / Space */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg text-xs">
                            {asset.roomName}
                          </span>
                        </td>

                        {/* 5. Version Control */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800">
                              {asset.version}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {(asset.versionHistory?.length || 0) + 1} {(asset.versionHistory?.length || 0) + 1 === 1 ? 'version' : 'versions'}
                            </span>
                          </div>
                        </td>

                        {/* 6. Section 9F Status */}
                        <td className="py-3 px-3 text-center">
                          {isClientRevision ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center gap-1 animate-pulse">
                              <RotateCcw className="w-3 h-3 text-purple-600" />
                              <span>Client Requested Changes</span>
                            </span>
                          ) : isPendingAdmin ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Admin Review</span>
                            </span>
                          ) : isApproved ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Homeowner Approved</span>
                            </span>
                          ) : isForwarded ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center gap-1">
                              <Send className="w-3 h-3 text-sky-600" />
                              <span>Forwarded to Homeowner</span>
                            </span>
                          ) : isRevisionUnderway ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              Revision Underway
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              {asset.adminReviewStatus}
                            </span>
                          )}
                        </td>

                        {/* 7. Admin Moderation Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPendingAdmin && (
                              <button
                                onClick={() => handleApproveInteriorAsset(asset)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Approve & Forward to Homeowner"
                              >
                                <Send className="w-3 h-3" />
                                <span>Forward</span>
                              </button>
                            )}

                            {isClientRevision && (
                              <button
                                onClick={() =>
                                  setInteriorActionModal({
                                    type: 'FORWARD_CUSTOMER_REVISION',
                                    asset,
                                    notes: asset.clientFeedback || '',
                                  })
                                }
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Forward Client Feedback to Designer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Route to Designer</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedInteriorAsset(asset)}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Inspect Drawing & Technical Audit"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-600" />
                              <span>Audit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Document Details</th>
                  <th className="py-3 px-3">Shared Project ID</th>
                  <th className="py-3 px-3">Architect Partner</th>
                  <th className="py-3 px-3">Homeowner Client</th>
                  <th className="py-3 px-3 text-center">Version Control</th>
                  <th className="py-3 px-3 text-center">Review Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDesigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No architectural documents match this filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredDesigns.map((d) => {
                    const isPending = d.status === 'SUBMITTED_TO_ADMIN';
                    const isCustomerRevision = d.status === 'CUSTOMER_REVISION_REQUESTED';
                    const isApproved = d.status === 'APPROVED' || d.status === 'CUSTOMER_APPROVED' || d.status === 'ADMIN_APPROVED';
                    const isForwarded = d.status === 'FORWARDED_TO_CUSTOMER' || d.status === 'PENDING_CUSTOMER_APPROVAL';
                    const isRevision = d.status === 'REVISION_REQUESTED';

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        {/* 1. Document Details */}
                        <td className="py-3 px-4">
                          <div
                            onClick={() => {
                              setSelectedDesign(d);
                              setInspectedVersion(d.versions?.[0] || null);
                            }}
                            className="cursor-pointer group"
                            title="Click to inspect drawing & technical audit"
                          >
                            <strong className="text-slate-900 group-hover:text-blue-600 transition-colors block text-xs">
                              {d.title}
                            </strong>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                                {d.fileType}
                              </span>
                              <span>{d.fileSize}</span>
                              <span>•</span>
                              <span className="text-slate-500 font-sans">{d.category.replace(/_/g, ' ')}</span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Shared Project ID */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                              {d.projectId}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                              {d.projectTitle}
                            </span>
                          </div>
                        </td>

                        {/* 3. Architect Partner */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block">{d.architectName || 'Lead Architect'}</span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                              {d.architectFirm || 'Studio Partner'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Homeowner Client */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block">{d.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{d.customerPhone || 'Client Contact'}</span>
                          </div>
                        </td>

                        {/* 5. Version Control */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800">
                              {d.currentVersion}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {d.versions?.length || 1} {(d.versions?.length || 1) === 1 ? 'version' : 'versions'}
                            </span>
                          </div>
                        </td>

                        {/* 6. Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {isPending ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Review</span>
                            </span>
                          ) : isForwarded ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center gap-1">
                              <Send className="w-3 h-3 text-sky-600" />
                              <span>Forwarded to Client</span>
                            </span>
                          ) : isApproved ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Client Approved</span>
                            </span>
                          ) : isCustomerRevision ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center gap-1">
                              <RotateCcw className="w-3 h-3 text-purple-600" />
                              <span>Client Requested Changes</span>
                            </span>
                          ) : isRevision ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              Revision Underway
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              {d.status}
                            </span>
                          )}
                        </td>

                        {/* 7. Moderation Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApproveAndForward(d)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="Approve & Forward to Homeowner"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Forward</span>
                                </button>
                                <button
                                  onClick={() => handleQuickApprove(d)}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Quick Approve Document"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => setRevisionModalDesign(d)}
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Request Revision from Architect"
                                >
                                  <RotateCcw className="w-3 h-3 text-amber-600" />
                                  <span>Revise</span>
                                </button>
                                <button
                                  onClick={() => handleRejectSubmission(d)}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Reject Technical Submission"
                                >
                                  <X className="w-3 h-3 text-rose-600" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {isCustomerRevision && (
                              <button
                                onClick={() => {
                                  setForwardCustomerRevisionDesign(d);
                                  setAdminForwardInstructions(d.customerComments || '');
                                }}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Route Customer Feedback to Architect"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Route to Arch</span>
                              </button>
                            )}

                            {d.status === 'REJECTED' && (
                              <button
                                onClick={() => handleReopenSubmission(d)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Reopen Rejected Submission"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reopen</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setVersionModalDesign(d);
                                setNewVersionFileName(`${d.title.replace(/\s+/g, '_')}_v${(parseFloat(d.currentVersion.replace('v', '')) + 0.1).toFixed(1)}.pdf`);
                                setNewVersionNotes('');
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Upload Successor Version"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Version</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedDesign(d);
                                setInspectedVersion(d.versions?.[0] || null);
                              }}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Inspect Blueprint & Technical Audit"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-600" />
                              <span>Audit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FULL-SCREEN MODAL: TECHNICAL AUDIT & DOCUMENT INSPECTION DRAWER */}
      <AnimatePresence>
        {selectedDesign && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedDesign(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Documents Registry</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <FileCode className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {selectedDesign.title}
                      </h2>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {selectedDesign.projectId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/40">
                        {selectedDesign.currentVersion}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Category: {selectedDesign.category.replace(/_/g, ' ')} • Architect: {selectedDesign.architectName || 'Lead Partner'} • Client: {selectedDesign.customerName}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => setSelectedDesign(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT SIDE: INTERACTIVE BLUEPRINT CANVAS & TECHNICAL SPECS (7 COLS) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Drawing Viewer Card */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Blueprint Visual Canvas &amp; Drawing Artifact
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {inspectedVersion ? inspectedVersion.versionNumber : selectedDesign.currentVersion}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZoomPreview(!zoomPreview)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{zoomPreview ? 'Standard' : 'Expand'}</span>
                        </button>

                        <a
                          href={inspectedVersion?.fileUrl || selectedDesign.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-navy-950 text-gold-400 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs hover:bg-navy-900 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>

                    {/* Canvas Frame */}
                    <div
                      className={`relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center transition-all ${
                        zoomPreview ? 'h-[650px]' : 'h-[420px]'
                      }`}
                    >
                      <img
                        src={inspectedVersion?.fileUrl || selectedDesign.fileUrl}
                        alt={selectedDesign.title}
                        className="max-h-full max-w-full object-contain select-none"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-white text-[11px] font-mono flex items-center gap-3">
                        <span>Format: {selectedDesign.fileType}</span>
                        <span>•</span>
                        <span>Size: {inspectedVersion?.fileSize || selectedDesign.fileSize}</span>
                        <span>•</span>
                        <span>Scale: 1:100 Metres</span>
                      </div>
                    </div>

                    {/* Technical Description & Revisions */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                      <p className="font-bold text-slate-800">Architect Specification Notes:</p>
                      <p className="text-slate-600 leading-relaxed">{selectedDesign.description}</p>
                      {selectedDesign.revisionNotes && (
                        <div className="pt-2 border-t border-slate-200 text-slate-700">
                          <span className="font-bold text-blue-900">Latest Revision Changes: </span>
                          <span>{selectedDesign.revisionNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Section 10 Technical Audit Checklist */}
                    <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 rounded-2xl border border-blue-200 text-xs space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                        <span className="font-black font-display text-navy-950">
                          Section 10 Technical Compliance Checklist (Admin Audit)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-blue-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Municipal Setback &amp; FAR Coverage Clear</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-blue-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Vastu Shastra Zoning &amp; Natural Light Flow</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-blue-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>IS 456 Structural Reinforcement Grids</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-blue-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Dimension Annotations &amp; Section Cuts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: AUDIT ACTIONS & VERSION HISTORY (5 COLS) */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Action Moderation Console Card */}
                  <div className="bg-white rounded-3xl p-5 border border-blue-200/90 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Admin Moderation &amp; Routing Console
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border">
                        {selectedDesign.status}
                      </span>
                    </div>

                    {/* Action 1: Forward to Customer */}
                    {selectedDesign.status === 'SUBMITTED_TO_ADMIN' && (
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                        <div>
                          <p className="font-bold text-emerald-950 text-xs">
                            Technical Audit Passed: Approve &amp; Deliver to Client
                          </p>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            Authorizes this drawing for the homeowner. Drawing will immediately appear in their Design Approvals desk.
                          </p>
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 text-[11px] block mb-1">
                            Handover Remarks &amp; Instructions to Homeowner:
                          </label>
                          <textarea
                            rows={2}
                            value={approveHandoverNotes}
                            onChange={(e) => setApproveHandoverNotes(e.target.value)}
                            placeholder="e.g. Setbacks and room dimensions checked per Indore Municipal norms. Ready for your review."
                            className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApproveAndForward(selectedDesign, approveHandoverNotes)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
                        >
                          <Send className="w-4 h-4" />
                          <span>Authorize &amp; Forward to Homeowner</span>
                        </button>
                      </div>
                    )}

                    {/* Action 2: Client Feedback Routing */}
                    {selectedDesign.status === 'CUSTOMER_REVISION_REQUESTED' && (
                      <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-purple-950 text-xs">
                              Homeowner Requested Revisions:
                            </p>
                            <p className="text-[11px] text-purple-900 mt-1 italic bg-white p-2.5 rounded-xl border border-purple-100">
                              "{selectedDesign.customerComments || 'Please adjust the kitchen layout and bedroom window sizes.'}"
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setForwardCustomerRevisionDesign(selectedDesign);
                            setAdminForwardInstructions(selectedDesign.customerComments || '');
                          }}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Forward Client Notes to Architect Studio</span>
                        </button>
                      </div>
                    )}

                    {/* Secondary Actions: Request Revision / Reject */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setRevisionModalDesign(selectedDesign);
                          setRevisionNotes(selectedDesign.adminReviewNotes || '');
                        }}
                        className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Request Revision</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectSubmission(selectedDesign)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reject Drawing</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 10 Version History Timeline */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                          <Clock className="w-4 h-4" />
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Immutable Version History
                        </h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedDesign.versions?.length || 1} Revisions Logged
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(selectedDesign.versions || []).map((ver, idx) => {
                        const isCurrent = (inspectedVersion?.versionNumber || selectedDesign.currentVersion) === ver.versionNumber;
                        return (
                          <div
                            key={ver.versionNumber}
                            onClick={() => setInspectedVersion(ver)}
                            className={`p-3 rounded-2xl border transition cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-100'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-white text-navy-950 border border-slate-200">
                                  {ver.versionNumber}
                                </span>
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatDate(ver.uploadedAt)}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-700 mt-2 font-medium">
                              {ver.revisionNotes || 'Version uploaded to project vault.'}
                            </p>

                            {ver.adminReviewNotes && (
                              <div className="mt-2 text-[10px] text-blue-900 bg-blue-100/60 p-2 rounded-xl">
                                <span className="font-bold">Admin Audit: </span>
                                {ver.adminReviewNotes}
                              </div>
                            )}

                            {ver.customerComments && (
                              <div className="mt-1.5 text-[10px] text-purple-900 bg-purple-100/60 p-2 rounded-xl">
                                <span className="font-bold">Homeowner: </span>
                                {ver.customerComments}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submitter & Project Manifest */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-md space-y-3 text-xs">
                    <p className="font-bold text-slate-900 text-xs border-b pb-2">Submitting Architect &amp; Client</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400">Architect:</span>
                        <span className="font-bold text-navy-950">{selectedDesign.architectName || 'Lead Partner'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400">Firm:</span>
                        <span className="font-semibold text-slate-900">{selectedDesign.architectFirm || 'Studio Design Desk'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400">Homeowner:</span>
                        <span className="font-bold text-navy-950">{selectedDesign.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400">Shared Project ID:</span>
                        <span className="font-mono font-bold text-blue-700">{selectedDesign.projectId}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REQUEST DESIGN REVISION */}
      <AnimatePresence>
        {revisionModalDesign && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <RotateCcw className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm font-display text-navy-950">
                      Request Technical Revision from Architect
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {revisionModalDesign.title} ({revisionModalDesign.currentVersion})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRevisionModalDesign(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmRequestRevision} className="space-y-4 text-xs">
                <p className="text-slate-600 text-[11px]">
                  Provide explicit technical feedback or redline requirements (e.g. municipal setbacks, column dimensions, room ergonomics). The architect will be notified in their Architect Studio.
                </p>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Redline Directives &amp; Revision Requirements *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="e.g. Setback on North boundary must be 1.5m minimum per municipal bye-laws. Align column C3 with ground stilt grid..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setRevisionModalDesign(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer hover:bg-navy-900"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Revision Request to Architect</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: FORWARD CLIENT REVISION TO ARCHITECT */}
      <AnimatePresence>
        {forwardCustomerRevisionDesign && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm font-display text-navy-950">
                      Route Client Feedback to Architect Studio
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {forwardCustomerRevisionDesign.title} ({forwardCustomerRevisionDesign.currentVersion})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForwardCustomerRevisionDesign(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmForwardCustomerRevision} className="space-y-4 text-xs">
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                  <p className="font-bold text-purple-950">Homeowner Feedback:</p>
                  <p className="text-purple-900 text-[11px] mt-1 italic">
                    "{forwardCustomerRevisionDesign.customerComments || 'Please revise room sizes per family requirements.'}"
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Admin Technical Instructions to Architect:
                  </label>
                  <textarea
                    rows={3}
                    value={adminForwardInstructions}
                    onChange={(e) => setAdminForwardInstructions(e.target.value)}
                    placeholder="Enter instructions for the architect to implement client changes..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setForwardCustomerRevisionDesign(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Route Directly to Architect</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: UPLOAD OFFICIAL DOCUMENT / BLUEPRINT */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back / Cancel</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      Upload Official Blueprint / Technical Document
                    </h2>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Direct Admin Technical Directorate Upload • Section 10 Specification
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1000px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
                <form onSubmit={handleCreateOfficialDocument} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Select Project (Shared Project ID) *
                      </label>
                      <select
                        required
                        value={uploadProjectId}
                        onChange={(e) => setUploadProjectId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                      >
                        <option value="">-- Choose Project --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id} - {p.name} ({p.customerName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Document Category *</label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                      >
                        <option value="MUNICIPAL_SANCTION">Municipal Sanctions &amp; Clearances</option>
                        <option value="HOUSE_MAP">House Map / Master Floor Plan</option>
                        <option value="ELEVATION_3D">3D Exterior Facade Elevation</option>
                        <option value="DRAWING_2D">2D Architectural Working Drawing</option>
                        <option value="STRUCTURAL_COORDINATION">Structural &amp; Rebar Schedule (IS 456)</option>
                        <option value="WORKING_DRAWINGS">MEP Electrical &amp; Plumbing Layout</option>
                        <option value="BOQ_SPEC">Detailed BOQ &amp; Cost Estimation</option>
                        <option value="OTHER">Other Technical Document</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Official Document Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Certified Municipal Setback Sanction Map &amp; Scrutiny Approval"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Technical Scope Description</label>
                    <textarea
                      rows={3}
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Enter details on FAR ratio, structural grade, sanction seal numbers..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">File Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sanction_Map_TCP_2026.pdf"
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Initial Version</label>
                      <input
                        type="text"
                        value={uploadVersion}
                        onChange={(e) => setUploadVersion(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Upload &amp; Link to Project</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN MODAL: INTERIOR DESIGN AUDIT & DOCUMENT INSPECTION DRAWER */}
      <AnimatePresence>
        {selectedInteriorAsset && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-yellow-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedInteriorAsset(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Interior Registry</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <Palette className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {selectedInteriorAsset.documentId}
                      </span>
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {selectedInteriorAsset.title}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/40 font-mono">
                        {selectedInteriorAsset.version}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Project: {selectedInteriorAsset.projectId} ({selectedInteriorAsset.projectName}) • Designer: {selectedInteriorAsset.uploadedBy} • Room: {selectedInteriorAsset.roomName}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => setSelectedInteriorAsset(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT SIDE: VISUAL CANVAS & SPECS (7 COLS) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Design Rendering / CAD Drawing Artifact
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {selectedInteriorAsset.version}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZoomPreview(!zoomPreview)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{zoomPreview ? 'Standard' : 'Expand'}</span>
                        </button>

                        <a
                          href={selectedInteriorAsset.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-navy-950 text-gold-400 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs hover:bg-navy-900 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download High-Res</span>
                        </a>
                      </div>
                    </div>

                    {/* Canvas Frame */}
                    <div
                      className={`relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center transition-all ${
                        zoomPreview ? 'h-[650px]' : 'h-[440px]'
                      }`}
                    >
                      <img
                        src={selectedInteriorAsset.fileUrl}
                        alt={selectedInteriorAsset.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Technical Specs Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                        <span className="font-bold text-navy-950">{selectedInteriorAsset.category.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Room / Space</span>
                        <span className="font-bold text-navy-950">{selectedInteriorAsset.roomName}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Uploaded By</span>
                        <span className="font-bold text-navy-950">{selectedInteriorAsset.uploadedBy}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">File Specs</span>
                        <span className="font-bold text-navy-950">{selectedInteriorAsset.fileSize}</span>
                      </div>
                    </div>

                    {selectedInteriorAsset.dimensionsOrSpecs && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Dimensions &amp; Materials Specs</span>
                        <span className="font-mono text-slate-800">{selectedInteriorAsset.dimensionsOrSpecs}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE: SECTION 9F AUDIT & MODERATION ACTION DESK (5 COLS) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Section 9F Compliance &amp; Customer Routing
                        </h3>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded">
                        Admin Desk
                      </span>
                    </div>

                    {/* Status Summary Banner */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold">Admin Audit Status:</span>
                        <span className="font-black px-2 py-0.5 rounded-full text-[10px] uppercase bg-amber-100 text-amber-900 border border-amber-300">
                          {selectedInteriorAsset.adminReviewStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold">Homeowner Status:</span>
                        <span className="font-black px-2 py-0.5 rounded-full text-[10px] uppercase bg-blue-100 text-blue-900 border border-blue-300">
                          {selectedInteriorAsset.clientApprovalStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold">Latest Approved Asset:</span>
                        <span className="font-mono font-bold text-[10px]">
                          {selectedInteriorAsset.isLatestApproved ? '✅ YES (Active Handover)' : '⏳ Awaiting Full Sign-off'}
                        </span>
                      </div>
                    </div>

                    {/* Homeowner Change Request Callout */}
                    {(selectedInteriorAsset.adminReviewStatus === 'CUSTOMER_REVISION_PENDING_ADMIN_FORWARD' ||
                      selectedInteriorAsset.clientApprovalStatus === 'CHANGES_REQUESTED' ||
                      Boolean(selectedInteriorAsset.clientFeedback)) && (
                      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-purple-900 font-bold">
                          <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Homeowner Change Request (Section 9F):</span>
                        </div>
                        <p className="text-purple-950 font-medium pl-6 leading-relaxed">
                          "{selectedInteriorAsset.clientFeedback || 'Revision requested on drawing/render.'}"
                        </p>
                        <div className="pt-2 border-t border-purple-200 flex justify-end">
                          <button
                            onClick={() =>
                              setInteriorActionModal({
                                type: 'FORWARD_CUSTOMER_REVISION',
                                asset: selectedInteriorAsset,
                                notes: selectedInteriorAsset.clientFeedback || '',
                              })
                            }
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Forward Revision Directives to Designer</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin Actions */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Admin Decision Controls
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            setInteriorActionModal({
                              type: 'APPROVE',
                              asset: selectedInteriorAsset,
                              notes: '',
                            })
                          }
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve &amp; Forward</span>
                        </button>

                        <button
                          onClick={() =>
                            setInteriorActionModal({
                              type: 'REVISE',
                              asset: selectedInteriorAsset,
                              notes: '',
                            })
                          }
                          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Request Revision</span>
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          setInteriorActionModal({
                            type: 'REJECT',
                            asset: selectedInteriorAsset,
                            notes: '',
                          })
                        }
                        className="w-full px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject Submission</span>
                      </button>
                    </div>

                    {/* Version Audit History */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Version History &amp; Audit Trail ({((selectedInteriorAsset.versionHistory?.length || 0) + 1)} Versions)
                      </span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-blue-950">Active {selectedInteriorAsset.version}</span>
                            <span className="text-[10px] text-slate-500 block">Uploaded {new Date(selectedInteriorAsset.uploadedAt).toLocaleString()}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Current
                          </span>
                        </div>

                        {(selectedInteriorAsset.versionHistory || []).map((hist, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                            <div>
                              <span className="font-mono font-bold text-slate-800">{hist.version} (Archived)</span>
                              <span className="text-[10px] text-slate-500 block">{hist.comments || 'Prior revision snapshot'}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{new Date(hist.uploadedAt).toLocaleString()}</span>
                            </div>
                            <a
                              href={hist.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                              title="Download previous version"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ACTION MODAL: INTERIOR DESIGN MODERATION DIALOG */}
      <AnimatePresence>
        {interiorActionModal.type && interiorActionModal.asset && (
          <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      interiorActionModal.type === 'APPROVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : interiorActionModal.type === 'FORWARD_CUSTOMER_REVISION'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {interiorActionModal.type === 'APPROVE' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <RotateCcw className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-navy-950 text-base">
                      {interiorActionModal.type === 'APPROVE' && 'Approve & Forward to Homeowner'}
                      {interiorActionModal.type === 'REVISE' && 'Request Designer Redline Revision'}
                      {interiorActionModal.type === 'FORWARD_CUSTOMER_REVISION' && 'Forward Client Changes to Designer'}
                      {interiorActionModal.type === 'REJECT' && 'Reject Submission'}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {interiorActionModal.asset.documentId} ({interiorActionModal.asset.version}) • {interiorActionModal.asset.roomName}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setInteriorActionModal({ type: null, asset: null, notes: '' })}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs space-y-3">
                <p className="text-slate-600 leading-relaxed">
                  {interiorActionModal.type === 'APPROVE' &&
                    'This deliverable will be marked approved by Admin and immediately forwarded to the homeowner portal for final sign-off.'}
                  {interiorActionModal.type === 'REVISE' &&
                    'Specify technical redlines and aesthetic adjustments needed from the Interior Designer before homeowner handover.'}
                  {interiorActionModal.type === 'FORWARD_CUSTOMER_REVISION' &&
                    'Route the homeowner feedback to the Interior Designer with your administrative instructions.'}
                  {interiorActionModal.type === 'REJECT' &&
                    'Provide the rejection reason. The Interior Designer will be required to re-upload according to specifications.'}
                </p>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    {interiorActionModal.type === 'APPROVE' ? 'Handover Notes / Verification Remarks (Optional)' : 'Directives & Comments (Required)'}
                  </label>
                  <textarea
                    rows={4}
                    value={interiorActionModal.notes}
                    onChange={(e) => setInteriorActionModal({ ...interiorActionModal, notes: e.target.value })}
                    placeholder={
                      interiorActionModal.type === 'APPROVE'
                        ? 'e.g. Dimensions and material finishes verified against design brief. Approved for client review.'
                        : 'e.g. Please alter headboard wooden louvers to light Scandinavian oak per client feedback.'
                    }
                    className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setInteriorActionModal({ type: null, asset: null, notes: '' })}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!interiorActionModal.asset) return;
                    if (interiorActionModal.type === 'APPROVE') {
                      handleApproveInteriorAsset(interiorActionModal.asset, interiorActionModal.notes);
                    } else if (interiorActionModal.type === 'REVISE') {
                      handleRequestInteriorRevision(interiorActionModal.asset, interiorActionModal.notes);
                    } else if (interiorActionModal.type === 'FORWARD_CUSTOMER_REVISION') {
                      handleForwardCustomerRevisionToInteriorDesigner(interiorActionModal.asset, interiorActionModal.notes);
                    } else if (interiorActionModal.type === 'REJECT') {
                      handleRejectInteriorAsset(interiorActionModal.asset, interiorActionModal.notes);
                    }
                  }}
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer ${
                    interiorActionModal.type === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : interiorActionModal.type === 'FORWARD_CUSTOMER_REVISION'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Decision</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: UPLOAD NEW VERSION */}
      <AnimatePresence>
        {versionModalDesign && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <History className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      Upload New Blueprint Version
                    </h3>
                    <p className="text-xs text-slate-500">
                      Publish successor drawing version for {versionModalDesign.projectId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVersionModalDesign(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewVersion} className="space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Document:</span>
                    <span className="font-bold text-navy-950">{versionModalDesign.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Current Version:</span>
                    <span className="font-mono font-bold text-blue-700">{versionModalDesign.currentVersion}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Successor Version:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      v{(parseFloat(versionModalDesign.currentVersion.replace('v', '')) + 0.1).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    File Name (with extension)
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionFileName}
                    onChange={(e) => setNewVersionFileName(e.target.value)}
                    placeholder="e.g. Master_Plan_Ground_v2.0_Revision.pdf"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      File Size
                    </label>
                    <input
                      type="text"
                      value={newVersionFileSize}
                      onChange={(e) => setNewVersionFileSize(e.target.value)}
                      placeholder="e.g. 4.2 MB"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Demo File URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={newVersionFileUrl}
                      onChange={(e) => setNewVersionFileUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Version Changelog / Redline Corrections (Required)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    placeholder="e.g. Kitchen relocated to Agni kon, front cantilever balcony reduced to 1.2m per municipal setback clearance."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setVersionModalDesign(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Publish Version</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: TECHNICAL REJECTION */}
      <AnimatePresence>
        {rejectModalDesign && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      Reject Technical Submission
                    </h3>
                    <p className="text-xs text-slate-500">
                      Flag drawing as non-compliant and return to partner architect
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectModalDesign(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmRejection} className="space-y-4">
                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">Drawing:</span>
                    <span className="font-bold text-slate-900">{rejectModalDesign.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">Architect:</span>
                    <span className="font-bold text-navy-950">{rejectModalDesign.architectName || 'Lead Partner'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Non-Compliance Reason
                  </label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 font-bold"
                  >
                    <option value="Setback violation under NBC 2016 norms">Setback violation under NBC 2016 norms</option>
                    <option value="Vastu orientation non-compliance">Vastu orientation non-compliance</option>
                    <option value="IS 456 Structural reinforcement discrepancy">IS 456 Structural reinforcement discrepancy</option>
                    <option value="Missing MEP plumbing/drainage line specs">Missing MEP plumbing/drainage line specs</option>
                    <option value="Drawing resolution illegible or dimensions unannotated">Drawing resolution illegible or dimensions unannotated</option>
                    <option value="Other technical non-compliance">Other technical non-compliance</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Specific Audit Notes &amp; Rectification Directives
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectCustomNotes}
                    onChange={(e) => setRejectCustomNotes(e.target.value)}
                    placeholder="Specify the exact drawing coordinate, column grid, or bye-law section that requires correction before re-submission."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setRejectModalDesign(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
