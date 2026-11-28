import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Eye,
  Download,
  Filter,
  Search,
  MessageSquare,
  Sparkles,
  X,
  FileText,
  Maximize2,
  Send,
  Plus,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  FolderOpen,
  MapPin,
  Check,
  Paperclip,
  Compass,
  Sofa,
  Bed,
  Utensils,
  Bath,
  Sun,
  Grid,
  Palette,
  FileCheck2,
  RefreshCw,
  History,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getInteriorDesignAssets,
  saveInteriorDesignAsset,
  submitDesignAssetToAdmin,
  createDesignAssetRevision,
  InteriorDesignAsset,
  InteriorDesignCategory,
  getInteriorProjects,
  InteriorProject,
  SEED_INTERIOR_DESIGNERS,
} from '../../data/interiorDesignerStore.js';
import { formatINR } from '../../lib/utils.js';

export type DesignStudioViewMode =
  | 'DESIGN_BRIEFS'
  | 'SPACE_PLANNING'
  | 'LAYOUT_2D'
  | 'VISUALIZATION_3D'
  | 'LIVING_ROOM'
  | 'BEDROOM'
  | 'KITCHEN'
  | 'BATHROOM'
  | 'FURNITURE_LAYOUT'
  | 'LIGHTING_LAYOUT'
  | 'FALSE_CEILING'
  | 'MATERIAL_FINISHES'
  | 'DESIGN_SUBMISSIONS'
  | 'REVISION_REQUESTS'
  | 'APPROVED_DESIGNS'
  | 'VERSION_HISTORY';

export const InteriorDesignerDesignStudio: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<InteriorProject[]>(() => getInteriorProjects());
  const [assets, setAssets] = useState<InteriorDesignAsset[]>(() => getInteriorDesignAssets());

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => searchParams.get('projectId') || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [previewAsset, setPreviewAsset] = useState<InteriorDesignAsset | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [revisionModal, setRevisionModal] = useState<{ open: boolean; asset: InteriorDesignAsset | null; newUrl: string; notes: string }>({
    open: false,
    asset: null,
    newUrl: '',
    notes: '',
  });

  // Upload Form State
  const [uploadData, setUploadData] = useState<{
    projectId: string;
    title: string;
    category: InteriorDesignCategory;
    roomName: string;
    version: string;
    fileUrl: string;
    dimensionsOrSpecs: string;
    submitImmediately: boolean;
  }>({
    projectId: projects[0]?.id || 'prj-int-1',
    title: '',
    category: 'VISUALIZATION_3D',
    roomName: 'Living & Dining Room',
    version: 'v1.0',
    fileUrl: '',
    dimensionsOrSpecs: '3840 x 2160 • 4K UHD Render • 3ds Max + V-Ray 6',
    submitImmediately: true,
  });

  const loadData = () => {
    setProjects(getInteriorProjects());
    setAssets(getInteriorDesignAssets());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('interior_assets_updated', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('interior_assets_updated', loadData);
    };
  }, []);

  // Current view from URL query param
  const currentView: DesignStudioViewMode =
    (searchParams.get('view') as DesignStudioViewMode) || 'DESIGN_BRIEFS';

  const handleSetView = (view: DesignStudioViewMode) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    setSearchParams(params);
  };

  // View-specific asset filtering
  const filterAssetsByView = (list: InteriorDesignAsset[], view: DesignStudioViewMode) => {
    return list.filter((a) => {
      if (selectedProjectId !== 'ALL' && a.projectId !== selectedProjectId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          a.title.toLowerCase().includes(q) ||
          a.roomName.toLowerCase().includes(q) ||
          a.documentId.toLowerCase().includes(q) ||
          a.projectName.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      switch (view) {
        case 'DESIGN_BRIEFS':
          return true;
        case 'SPACE_PLANNING':
          return a.category === 'SPACE_PLANNING';
        case 'LAYOUT_2D':
          return a.category === 'LAYOUT_2D';
        case 'VISUALIZATION_3D':
          return a.category === 'VISUALIZATION_3D';
        case 'LIVING_ROOM':
          return (
            a.roomName.toLowerCase().includes('living') ||
            a.roomName.toLowerCase().includes('dining') ||
            a.title.toLowerCase().includes('living')
          );
        case 'BEDROOM':
          return (
            a.roomName.toLowerCase().includes('bedroom') ||
            a.roomName.toLowerCase().includes('suite') ||
            a.title.toLowerCase().includes('bedroom')
          );
        case 'KITCHEN':
          return (
            a.roomName.toLowerCase().includes('kitchen') ||
            a.title.toLowerCase().includes('kitchen')
          );
        case 'BATHROOM':
          return (
            a.roomName.toLowerCase().includes('bath') ||
            a.roomName.toLowerCase().includes('toilet') ||
            a.roomName.toLowerCase().includes('powder') ||
            a.title.toLowerCase().includes('bath')
          );
        case 'FURNITURE_LAYOUT':
          return (
            a.title.toLowerCase().includes('furniture') ||
            a.title.toLowerCase().includes('joinery') ||
            (a.dimensionsOrSpecs && a.dimensionsOrSpecs.toLowerCase().includes('furniture')) ||
            a.category === 'SPACE_PLANNING'
          );
        case 'LIGHTING_LAYOUT':
          return (
            a.title.toLowerCase().includes('light') ||
            a.title.toLowerCase().includes('wiring') ||
            (a.dimensionsOrSpecs && a.dimensionsOrSpecs.toLowerCase().includes('track')) ||
            (a.dimensionsOrSpecs && a.dimensionsOrSpecs.toLowerCase().includes('lighting'))
          );
        case 'FALSE_CEILING':
          return (
            a.title.toLowerCase().includes('ceiling') ||
            a.title.toLowerCase().includes('cove') ||
            a.title.toLowerCase().includes('pelmet') ||
            (a.dimensionsOrSpecs && a.dimensionsOrSpecs.toLowerCase().includes('ceiling'))
          );
        case 'MATERIAL_FINISHES':
          return a.category === 'MATERIAL_FINISHES' || a.category === 'MOOD_BOARD';
        case 'DESIGN_SUBMISSIONS':
          return true; // All official submissions
        case 'REVISION_REQUESTS':
          return (
            a.adminReviewStatus === 'REVISION_REQUESTED' ||
            a.clientApprovalStatus === 'REVISION_REQUESTED'
          );
        case 'APPROVED_DESIGNS':
          return a.adminReviewStatus === 'APPROVED_BY_ADMIN' && a.clientApprovalStatus === 'APPROVED';
        case 'VERSION_HISTORY':
          return true;
        default:
          return true;
      }
    });
  };

  const filteredAssets = useMemo(() => {
    return filterAssetsByView(assets, currentView);
  }, [assets, currentView, selectedProjectId, searchQuery]);

  // Counts for each of the 16 views
  const viewCounts = useMemo(() => {
    const counts: Record<DesignStudioViewMode, number> = {
      DESIGN_BRIEFS: projects.filter((p) => p.designBrief).length,
      SPACE_PLANNING: assets.filter((a) => a.category === 'SPACE_PLANNING').length,
      LAYOUT_2D: assets.filter((a) => a.category === 'LAYOUT_2D').length,
      VISUALIZATION_3D: assets.filter((a) => a.category === 'VISUALIZATION_3D').length,
      LIVING_ROOM: assets.filter((a) => a.roomName.toLowerCase().includes('living') || a.roomName.toLowerCase().includes('dining')).length,
      BEDROOM: assets.filter((a) => a.roomName.toLowerCase().includes('bedroom')).length,
      KITCHEN: assets.filter((a) => a.roomName.toLowerCase().includes('kitchen')).length,
      BATHROOM: assets.filter((a) => a.roomName.toLowerCase().includes('bath')).length,
      FURNITURE_LAYOUT: assets.filter((a) => a.title.toLowerCase().includes('furniture') || a.category === 'SPACE_PLANNING').length,
      LIGHTING_LAYOUT: assets.filter((a) => a.title.toLowerCase().includes('light') || a.title.toLowerCase().includes('wiring')).length,
      FALSE_CEILING: assets.filter((a) => a.title.toLowerCase().includes('ceiling') || a.title.toLowerCase().includes('cove')).length,
      MATERIAL_FINISHES: assets.filter((a) => a.category === 'MATERIAL_FINISHES' || a.category === 'MOOD_BOARD').length,
      DESIGN_SUBMISSIONS: assets.length,
      REVISION_REQUESTS: assets.filter((a) => a.adminReviewStatus === 'REVISION_REQUESTED' || a.clientApprovalStatus === 'REVISION_REQUESTED').length,
      APPROVED_DESIGNS: assets.filter((a) => a.adminReviewStatus === 'APPROVED_BY_ADMIN' && a.clientApprovalStatus === 'APPROVED').length,
      VERSION_HISTORY: assets.reduce((acc, a) => acc + 1 + (a.versionHistory?.length || 0), 0),
    };
    return counts;
  }, [assets, projects]);

  const DESIGN_VIEW_TABS: { id: DesignStudioViewMode; label: string; icon: any }[] = [
    { id: 'DESIGN_BRIEFS', label: '1. Design Briefs', icon: FileText },
    { id: 'SPACE_PLANNING', label: '2. Space Planning', icon: Compass },
    { id: 'LAYOUT_2D', label: '3. 2D Layout Design', icon: Grid },
    { id: 'VISUALIZATION_3D', label: '4. 3D Interior Design', icon: Box },
    { id: 'LIVING_ROOM', label: '5. Living Room Design', icon: Sofa },
    { id: 'BEDROOM', label: '6. Bedroom Design', icon: Bed },
    { id: 'KITCHEN', label: '7. Kitchen Design', icon: Utensils },
    { id: 'BATHROOM', label: '8. Bathroom Design', icon: Bath },
    { id: 'FURNITURE_LAYOUT', label: '9. Furniture Layout', icon: Layers },
    { id: 'LIGHTING_LAYOUT', label: '10. Lighting Layout', icon: Sun },
    { id: 'FALSE_CEILING', label: '11. False Ceiling Design', icon: Sparkles },
    { id: 'MATERIAL_FINISHES', label: '12. Material & Finish Selection', icon: Palette },
    { id: 'DESIGN_SUBMISSIONS', label: '13. Design Submissions', icon: FileCheck2 },
    { id: 'REVISION_REQUESTS', label: '14. Revision Requests', icon: RefreshCw },
    { id: 'APPROVED_DESIGNS', label: '15. Approved Designs', icon: CheckCircle2 },
    { id: 'VERSION_HISTORY', label: '16. Design Version History', icon: History },
  ];

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.title.trim()) {
      error('Please enter a design title.');
      return;
    }

    const targetProj = projects.find((p) => p.id === uploadData.projectId);
    const newFile = uploadData.fileUrl.trim() || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600';

    const saved = saveInteriorDesignAsset({
      projectId: uploadData.projectId,
      projectName: targetProj?.title || 'Interior Project',
      title: uploadData.title,
      category: uploadData.category,
      roomName: uploadData.roomName,
      version: uploadData.version,
      fileUrl: newFile,
      thumbnailUrl: newFile,
      dimensionsOrSpecs: uploadData.dimensionsOrSpecs,
      adminReviewStatus: 'PENDING_ADMIN_REVIEW',
      clientApprovalStatus: 'PENDING_CUSTOMER_REVIEW',
    });

    if (uploadData.submitImmediately) {
      submitDesignAssetToAdmin(saved.id);
      success(`Design asset ${saved.documentId} submitted to Admin for quality audit!`);
    } else {
      success(`Design asset ${saved.documentId} saved to workspace!`);
    }

    setIsUploadModalOpen(false);
    setUploadData({
      projectId: projects[0]?.id || 'prj-int-1',
      title: '',
      category: 'VISUALIZATION_3D',
      roomName: 'Living & Dining Room',
      version: 'v1.0',
      fileUrl: '',
      dimensionsOrSpecs: '3840 x 2160 • 4K UHD Render • 3ds Max + V-Ray 6',
      submitImmediately: true,
    });
    loadData();
  };

  const handleCreateRevision = () => {
    if (!revisionModal.asset) return;
    try {
      const newUrl = revisionModal.newUrl.trim() || revisionModal.asset.fileUrl;
      const revised = createDesignAssetRevision(revisionModal.asset.id, newUrl, revisionModal.notes);
      success(`New version ${revised.version} submitted for ${revised.documentId}!`);
      setRevisionModal({ open: false, asset: null, newUrl: '', notes: '' });
      loadData();
    } catch (e: any) {
      error(e.message || 'Failed to create revision');
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* ---------------- HEADER & VIEW SELECTOR ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black uppercase font-mono mb-1.5 border border-blue-200">
            <Box className="w-3.5 h-3.5 text-blue-600" />
            <span>Module 5 • Interior Design Studio & Spatial Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Interior Design Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Complete architectural space planning, 2D working drawings, 4K photorealistic 3D renders, and room-by-room finishes with BuildGhar Admin-governed customer approval workflows.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={currentView}
              onChange={(e) => handleSetView(e.target.value as DesignStudioViewMode)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-950 shadow-2xs hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              {DESIGN_VIEW_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} ({viewCounts[tab.id]})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-2 shadow-sm shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Design</span>
          </button>
        </div>
      </div>

      {/* ---------------- 16-PILL SUB-FEATURE ACTION STRIP ---------------- */}
      <div className="p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {DESIGN_VIEW_TABS.map((tab) => {
            const isActive = currentView === tab.id;
            const Icon = tab.icon;
            const count = viewCounts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => handleSetView(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- SECTION 9 ROUTING RULE BANNER ---------------- */}
      <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong>Section 9 Design Submission Rule:</strong> Designer uploads drawing ➔ BuildGhar Admin verifies compliance ➔ Admin forwards to Customer ➔ Customer Approves or Requests Revision. All drawings are version controlled (`v1.0`, `v2.0`).
          </span>
        </div>
        <span className="font-mono font-bold bg-white text-blue-900 px-3 py-1 rounded-full border border-blue-200 shrink-0 text-[11px]">
          Admin Mediated Workflow
        </span>
      </div>

      {/* ---------------- PROJECT FILTER & SEARCH BAR ---------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-bold text-slate-500 shrink-0 pl-2">Filter by Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950 focus:border-blue-500"
          >
            <option value="ALL">All Shared Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectId} - {p.title} ({p.customerName})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search drawings, rooms, doc IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-navy-950 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DESIGN BRIEFS (APPROVED CLIENT BRIEFS - SECTION 9A)              */}
      {/* ========================================================================= */}
      {currentView === 'DESIGN_BRIEFS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Approved Design Briefs & Scope Directives</h3>
                <p className="text-xs text-slate-600">
                  Interior Designer must work strictly from these Admin-approved briefs. All revisions must be logged as formal change requests.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-emerald-900 border border-emerald-200 font-mono font-bold text-xs">
              {projects.filter((p) => p.designBrief).length} Verified Briefs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects
              .filter((p) => p.designBrief && (selectedProjectId === 'ALL' || p.id === selectedProjectId))
              .map((p) => {
                const b = p.designBrief!;
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3.5 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-blue-700 text-xs bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        {p.projectId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                        Admin Approved Brief
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-navy-950 text-base">{p.title}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{p.location} • Client: {p.customerName}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block">Approved Style & Theme</span>
                        <span className="font-bold text-navy-950">{b.designStyle}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{b.customerRequirements}</p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Preferences</span>
                      <div className="flex flex-wrap gap-1">
                        {b.materialPreferences.map((m, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Target Budget</span>
                        <span className="font-mono font-bold text-navy-950">{formatINR(b.targetBudget)}</span>
                      </div>
                      <button
                        onClick={() => {
                          handleSetView('VISUALIZATION_3D');
                          setSelectedProjectId(p.id);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <span>Open 3D Renders</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEWS 2 TO 15: ASSETS GRID (FILTERED BY VIEW)                             */}
      {/* ========================================================================= */}
      {currentView !== 'DESIGN_BRIEFS' && currentView !== 'VERSION_HISTORY' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header banner describing the active category */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-extrabold text-navy-950 text-sm">
                {DESIGN_VIEW_TABS.find((t) => t.id === currentView)?.label}
              </h3>
              <p className="text-slate-500 mt-0.5">
                Showing {filteredAssets.length} verified deliverables for project: {selectedProjectId === 'ALL' ? 'All Shared Projects' : selectedProjectId}
              </p>
            </div>
            <button
              onClick={() => {
                setUploadData((prev) => ({
                  ...prev,
                  title: `${DESIGN_VIEW_TABS.find((t) => t.id === currentView)?.label.replace(/^\d+\.\s*/, '')} Plan`,
                }));
                setIsUploadModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New File</span>
            </button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200">
              <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-navy-950">No Drawings Found in This Category</h4>
              <p className="text-xs text-slate-500 mt-1">Upload a drawing or select "All Shared Projects" to view files.</p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Upload Drawing Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Thumbnail Preview Area */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setPreviewAsset(asset)}>
                      <img
                        src={asset.thumbnailUrl || asset.fileUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent flex items-end justify-between p-3.5">
                        <span className="font-mono font-bold text-white text-xs bg-navy-950/80 px-2.5 py-0.5 rounded-full border border-white/20">
                          {asset.documentId} • {asset.version}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewAsset(asset);
                          }}
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-navy-950 backdrop-blur-xs transition"
                          title="Fullscreen View"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Body */}
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                          {asset.roomName} • {asset.category.replace(/_/g, ' ')}
                        </span>
                        <h4 className="font-extrabold text-navy-950 text-sm mt-0.5 line-clamp-1">{asset.title}</h4>
                        <span className="text-xs text-slate-400 block mt-0.5">{asset.projectName}</span>
                      </div>

                      {/* Dimensions or Specs */}
                      {asset.dimensionsOrSpecs && (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-mono">
                          {asset.dimensionsOrSpecs}
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            asset.adminReviewStatus === 'APPROVED_BY_ADMIN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : asset.adminReviewStatus === 'REVISION_REQUESTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          Admin: {asset.adminReviewStatus.replace(/_/g, ' ')}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            asset.clientApprovalStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : asset.clientApprovalStatus === 'REVISION_REQUESTED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Client: {asset.clientApprovalStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Feedback Note if Revision Requested */}
                      {asset.adminFeedback && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                          <span className="font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Admin Revision Feedback:
                          </span>
                          <p className="text-[11px] text-amber-900">{asset.adminFeedback}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {asset.uploadedAt.slice(0, 10)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewAsset(asset)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      {asset.adminReviewStatus === 'REVISION_REQUESTED' && (
                        <button
                          onClick={() => setRevisionModal({ open: true, asset, newUrl: '', notes: '' })}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Revise</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 16: DESIGN VERSION HISTORY (IMMUTABLE AUDIT TRAIL)                   */}
      {/* ========================================================================= */}
      {currentView === 'VERSION_HISTORY' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Design Drawing Version History & Audit Log</h3>
                <p className="text-xs text-slate-600">
                  Every drawing upload creates an immutable revision stamp (`v1.0`, `v1.1`, `v2.0`) recorded in BuildGhar Vault.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              {assets.length} Master Assets Tracked
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-extrabold text-navy-950 text-base">Complete Version Change Log</h4>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3.5">Document ID & Title</th>
                    <th className="py-3 px-3.5">Project & Room</th>
                    <th className="py-3 px-3.5">Current Version</th>
                    <th className="py-3 px-3.5">Admin Audit Status</th>
                    <th className="py-3 px-3.5">Client Status</th>
                    <th className="py-3 px-3.5">Last Uploaded</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                            {asset.documentId}
                          </span>
                          <span className="font-bold text-navy-950">{asset.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-medium text-slate-800 block">{asset.projectName}</span>
                        <span className="text-[11px] text-slate-400">{asset.roomName}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold text-blue-800 bg-slate-100 px-2 py-0.5 rounded">
                          {asset.version}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            asset.adminReviewStatus === 'APPROVED_BY_ADMIN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : asset.adminReviewStatus === 'REVISION_REQUESTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {asset.adminReviewStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-700">
                          {asset.clientApprovalStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">
                        {asset.uploadedAt.slice(0, 10)}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => setPreviewAsset(asset)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs"
                        >
                          Inspect File
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD DESIGN DRAWING (SECTION 9 MANDATORY COMPLIANCE)            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-navy-950 text-base">Upload Design Deliverable</h3>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-navy-950 block mb-1">Target Project</label>
                  <select
                    value={uploadData.projectId}
                    onChange={(e) => setUploadData({ ...uploadData, projectId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-bold"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectId} - {p.title} ({p.customerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Drawing / Deliverable Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Living Room 4K Evening Render with Statuario Marble"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Design Category</label>
                    <select
                      value={uploadData.category}
                      onChange={(e) => setUploadData({ ...uploadData, category: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-semibold"
                    >
                      <option value="VISUALIZATION_3D">3D Photorealistic Render</option>
                      <option value="LAYOUT_2D">2D Working CAD Layout</option>
                      <option value="SPACE_PLANNING">Space Planning & Zoning</option>
                      <option value="MATERIAL_FINISHES">Material & Finish Swatches</option>
                      <option value="MOOD_BOARD">Design Moodboard</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Room / Zone</label>
                    <input
                      type="text"
                      placeholder="e.g. Living & Dining, Kitchen, Master Suite"
                      value={uploadData.roomName}
                      onChange={(e) => setUploadData({ ...uploadData, roomName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Drawing Image or Document URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or cloud PDF/DWG link"
                    value={uploadData.fileUrl}
                    onChange={(e) => setUploadData({ ...uploadData, fileUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Leave blank for sample render asset.</span>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Technical Specifications / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. 3840 x 2160 UHD • Scale 1:25 • Blum Antaro & Statuario Italian Marble"
                    value={uploadData.dimensionsOrSpecs}
                    onChange={(e) => setUploadData({ ...uploadData, dimensionsOrSpecs: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Upload will create version <strong>{uploadData.version}</strong> and automatically submit to BuildGhar Admin for compliance review.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Submit to Admin</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE REVISION (SECTION 9 VERSION BUMP v1.0 -> v2.0)            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {revisionModal.open && revisionModal.asset && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <h3 className="font-black text-navy-950 text-base">Submit Revised Version</h3>
                </div>
                <button
                  onClick={() => setRevisionModal({ open: false, asset: null, newUrl: '', notes: '' })}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Deliverable</span>
                  <span className="font-bold text-navy-950 block">{revisionModal.asset.title}</span>
                  <span className="font-mono text-blue-700 text-[11px]">
                    Current Version: {revisionModal.asset.version} ➔ Next Version: v
                    {(parseFloat(revisionModal.asset.version.replace('v', '')) + 0.1).toFixed(1)}
                  </span>
                </div>

                {revisionModal.asset.adminFeedback && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
                    <span className="font-bold block text-[11px] mb-0.5">Admin Feedback to Rectify:</span>
                    <p className="text-amber-900">{revisionModal.asset.adminFeedback}</p>
                  </div>
                )}

                <div>
                  <label className="font-bold text-navy-950 block mb-1">New Revised File / Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={revisionModal.newUrl}
                    onChange={(e) => setRevisionModal({ ...revisionModal, newUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Revision Notes & Changes Made</label>
                  <textarea
                    rows={3}
                    placeholder="Describe changes made to rectify Admin/Client feedback..."
                    value={revisionModal.notes}
                    onChange={(e) => setRevisionModal({ ...revisionModal, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setRevisionModal({ open: false, asset: null, newUrl: '', notes: '' })}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRevision}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Revision for Admin Audit</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: FULLSCREEN IMAGE LIGHTBOX PREVIEW                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewAsset && (
          <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-700 text-xs bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {previewAsset.documentId} • {previewAsset.version}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        previewAsset.adminReviewStatus === 'APPROVED_BY_ADMIN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {previewAsset.adminReviewStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-black text-navy-950 text-base mt-1">{previewAsset.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Full Image */}
              <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center max-h-[60vh]">
                <img
                  src={previewAsset.fileUrl}
                  alt={previewAsset.title}
                  className="w-full h-full object-contain max-h-[60vh]"
                />
              </div>

              {/* Specs & Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Room / Zone</span>
                  <span className="font-bold text-navy-950">{previewAsset.roomName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                  <span className="font-bold text-navy-950">{previewAsset.category.replace(/_/g, ' ')}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Uploaded On</span>
                  <span className="font-mono font-bold text-navy-950">{previewAsset.uploadedAt.slice(0, 10)}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Client Status</span>
                  <span className="font-bold text-emerald-700">{previewAsset.clientApprovalStatus.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {previewAsset.dimensionsOrSpecs && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block mb-0.5">Specifications</span>
                  {previewAsset.dimensionsOrSpecs}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
                <a
                  href={previewAsset.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Raw CAD/UHD Render</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
