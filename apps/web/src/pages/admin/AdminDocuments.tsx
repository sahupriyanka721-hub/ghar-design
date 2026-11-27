import React, { useState, useMemo } from 'react';
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
  ArchitecturalDesign,
  DesignCategory,
  DesignStatus,
  DesignVersionItem,
} from '../../data/architectPanelStore.js';
import { getExecutionProjects, ExecutionProject } from '../../data/projectExecutionStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';
import { pushToCloud } from '../../data/cloudSync.js';

type DocumentStatusFilter = 'ALL' | 'PENDING_REVIEW' | 'FORWARDED' | 'APPROVED' | 'REVISION' | 'REJECTED';

export const AdminDocuments: React.FC = () => {
  const { success, error } = useToast();

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

      // 2. Status Tab
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

      // 3. Category Filter
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
  }, [designs, search, activeStatusTab, activeCategoryFilter]);

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
              Architectural Design &amp; Technical Document Review Desk
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 10 Master Review Console: Floor Plans, 3D Facades, Structural CAD (IS 456), Working MEP, BOQ &amp; Multi-Version Customer Handover.
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

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Submissions</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black font-display text-navy-950 mt-1">{counts.all}</p>
          <span className="text-[10px] text-slate-400 font-medium">All Project Drawings</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Admin Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-display text-amber-950 mt-1">{counts.pending}</p>
          <span className="text-[10px] text-amber-700 font-bold">Needs Technical Audit</span>
        </div>

        <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200 shadow-2xs">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Forwarded to Client</span>
            <Send className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black font-display text-sky-950 mt-1">{counts.forwarded}</p>
          <span className="text-[10px] text-sky-700 font-medium">Awaiting Client Decision</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Client Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-display text-emerald-950 mt-1">{counts.approved}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Locked for Execution</span>
        </div>

        <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Revisions</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black font-display text-purple-950 mt-1">{counts.revision}</p>
          <span className="text-[10px] text-purple-700 font-medium">Redlines in Progress</span>
        </div>
      </div>

      {/* Filter Tabs & Category Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: 'All Submissions', value: 'ALL', count: counts.all },
              { label: 'Pending Review', value: 'PENDING_REVIEW', count: counts.pending },
              { label: 'Forwarded to Client', value: 'FORWARDED', count: counts.forwarded },
              { label: 'Client Approved', value: 'APPROVED', count: counts.approved },
              { label: 'Revisions Active', value: 'REVISION', count: counts.revision },
              { label: 'Rejected', value: 'REJECTED', count: counts.rejected },
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
              placeholder="Search drawing, project ID, architect..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Document Category:
          </span>
          {[
            { label: 'All Categories', value: 'ALL' },
            { label: '📐 Floor Plans & House Maps', value: 'FLOOR_PLAN' },
            { label: '🎨 3D Facades & Elevations', value: 'ELEVATION_3D' },
            { label: '📏 2D & Sectional Blueprints', value: 'DRAWING_2D' },
            { label: '🏗️ Structural & Column Grids', value: 'STRUCTURAL' },
            { label: '⚙️ Working Drawings & MEP', value: 'WORKING_DRAWINGS' },
            { label: '📊 BOQ & Cost Estimates', value: 'BOQ_SPEC' },
            { label: '🏛️ Municipal Sanctions', value: 'MUNICIPAL_SANCTION' },
          ].map((cat) => (
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

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 mt-2">
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
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleApproveAndForward(d)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Approve & Forward to Homeowner"
                            >
                              <Send className="w-3 h-3" />
                              <span>Forward</span>
                            </button>
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
    </div>
  );
};
