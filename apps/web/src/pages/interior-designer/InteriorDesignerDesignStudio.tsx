import React, { useState, useEffect } from 'react';
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

export const InteriorDesignerDesignStudio: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<InteriorProject[]>(() => getInteriorProjects());
  const [assets, setAssets] = useState<InteriorDesignAsset[]>(() => getInteriorDesignAssets());

  const [activeTab, setActiveTab] = useState<'ALL' | 'BRIEFS' | 'SPACE_PLANNING' | 'LAYOUT_2D' | 'VISUALIZATION_3D' | 'MATERIAL_FINISHES' | 'SUBMISSIONS'>('ALL');
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
    roomName: 'Living Room',
    version: 'v1.0',
    fileUrl: '',
    dimensionsOrSpecs: '3840 x 2160 • 4K UHD Render • 3ds Max + V-Ray',
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

  // Filtered Assets
  const filteredAssets = assets.filter((a) => {
    if (selectedProjectId !== 'ALL' && a.projectId !== selectedProjectId) return false;
    if (activeTab === 'SPACE_PLANNING' && a.category !== 'SPACE_PLANNING') return false;
    if (activeTab === 'LAYOUT_2D' && a.category !== 'LAYOUT_2D') return false;
    if (activeTab === 'VISUALIZATION_3D' && a.category !== 'VISUALIZATION_3D') return false;
    if (activeTab === 'MATERIAL_FINISHES' && a.category !== 'MATERIAL_FINISHES') return false;
    if (activeTab === 'SUBMISSIONS' && a.adminReviewStatus === 'PENDING_ADMIN_REVIEW') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.roomName.toLowerCase().includes(q) ||
        a.documentId.toLowerCase().includes(q) ||
        a.projectName.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
      adminReviewStatus: uploadData.submitImmediately ? 'PENDING_ADMIN_REVIEW' : 'PENDING_ADMIN_REVIEW',
      clientApprovalStatus: 'PENDING_CUSTOMER_REVIEW',
    });

    if (uploadData.submitImmediately) {
      submitDesignAssetToAdmin(saved.id);
      success(`Design asset ${saved.documentId} submitted to Admin for review!`);
    } else {
      success(`Design asset ${saved.documentId} saved to workspace!`);
    }

    setIsUploadModalOpen(false);
    setUploadData({
      projectId: projects[0]?.id || 'prj-int-1',
      title: '',
      category: 'VISUALIZATION_3D',
      roomName: 'Living Room',
      version: 'v1.0',
      fileUrl: '',
      dimensionsOrSpecs: '3840 x 2160 • 4K UHD Render • 3ds Max + V-Ray',
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
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black uppercase font-mono mb-1.5 border border-blue-200">
            <Box className="w-3.5 h-3.5 text-blue-600" />
            <span>Section 9 • Interior Design Management Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Design Studio & Document Submissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Space planning, 2D working drawings, photorealistic 3D renders, and material finish palettes organized with Admin mediated customer approval workflows.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-2 shadow-md self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Design Drawing</span>
        </button>
      </div>

      {/* ---------------- SECTION 9 ROUTING RULE BANNER ---------------- */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong>Section 9 Design Submission Rule:</strong> Interior Designer uploads design ➔ BuildGhar Admin verifies compliance ➔ Admin forwards to Customer ➔ Customer Approves or Requests Revision. Every upload is version controlled (`v1.0`, `v2.0`).
          </span>
        </div>
        <span className="font-mono font-bold bg-white text-blue-900 px-3 py-1 rounded-full border border-blue-200 shrink-0">
          Immutable Versions
        </span>
      </div>

      {/* ---------------- PROJECT SELECTOR & SEARCH ---------------- */}
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

      {/* ---------------- SECTION 9 CATEGORY TABS ---------------- */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {[
          { tab: 'ALL', label: 'All Designs', count: assets.length },
          { tab: 'BRIEFS', label: '9A. Approved Design Briefs', count: projects.filter((p) => p.designBrief).length },
          { tab: 'SPACE_PLANNING', label: '9B. Space Planning (Layouts)', count: assets.filter((a) => a.category === 'SPACE_PLANNING').length },
          { tab: 'LAYOUT_2D', label: '9C. 2D Working CAD Plans', count: assets.filter((a) => a.category === 'LAYOUT_2D').length },
          { tab: 'VISUALIZATION_3D', label: '9D. 3D Photorealistic Renders', count: assets.filter((a) => a.category === 'VISUALIZATION_3D').length },
          { tab: 'MATERIAL_FINISHES', label: '9E. Material & Finish Palettes', count: assets.filter((a) => a.category === 'MATERIAL_FINISHES').length },
          { tab: 'SUBMISSIONS', label: '9F. Revisions & Version Audit', count: assets.filter((a) => a.adminReviewStatus === 'REVISION_REQUESTED').length },
        ].map((t) => (
          <button
            key={t.tab}
            onClick={() => setActiveTab(t.tab as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === t.tab
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === t.tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* VIEW: SECTION 9A APPROVED DESIGN BRIEFS                                   */}
      {/* ========================================================================= */}
      {activeTab === 'BRIEFS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects
              .filter((p) => p.designBrief && (selectedProjectId === 'ALL' || p.id === selectedProjectId))
              .map((p) => {
                const b = p.designBrief!;
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-blue-300 transition"
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
                        <span>{p.location}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block">Approved Style & Theme</span>
                        <span className="font-bold text-navy-950">{b.designStyle}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{b.customerRequirements}</p>
                    </div>

                    {/* Preferences Tags */}
                    <div className="space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Preferences</span>
                      <div className="flex flex-wrap gap-1">
                        {b.materialPreferences.map((m, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Approved Budget:</span>
                      <span className="font-mono font-bold text-navy-950">{formatINR(b.targetBudget)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: DESIGN ASSETS GRID (SPACE PLANNING, 2D, 3D, MATERIAL FINISHES)      */}
      {/* ========================================================================= */}
      {activeTab !== 'BRIEFS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between overflow-hidden"
            >
              {/* Image Preview & Badges */}
              <div className="relative h-48 bg-slate-100 overflow-hidden group cursor-pointer" onClick={() => setPreviewAsset(asset)}>
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-navy-950/20 group-hover:bg-navy-950/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="p-2.5 rounded-full bg-white/90 text-navy-950 shadow-md">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-navy-950/80 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                    {asset.version}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-bold backdrop-blur-xs">
                    {asset.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase backdrop-blur-xs ${
                      asset.clientApprovalStatus === 'APPROVED'
                        ? 'bg-emerald-600/90 text-white'
                        : asset.adminReviewStatus === 'REVISION_REQUESTED'
                        ? 'bg-rose-600/90 text-white'
                        : 'bg-amber-600/90 text-white'
                    }`}
                  >
                    {asset.clientApprovalStatus === 'APPROVED' ? 'CLIENT APPROVED' : asset.adminReviewStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2.5">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-700">{asset.documentId}</span>
                  <h3 className="font-bold text-navy-950 text-sm leading-snug">{asset.title}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Room: <span className="font-semibold text-slate-700">{asset.roomName}</span> • {asset.projectName}
                  </div>
                </div>

                {asset.dimensionsOrSpecs && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                    {asset.dimensionsOrSpecs}
                  </p>
                )}

                {/* Feedback Alert if Revision */}
                {asset.adminFeedback && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-amber-900 leading-tight">
                      <strong>Feedback:</strong> {asset.adminFeedback}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">{asset.fileSize}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewAsset(asset)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                    title="Inspect & View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={asset.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                    title="Download Drawing"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {asset.adminReviewStatus === 'REVISION_REQUESTED' && (
                    <button
                      onClick={() => setRevisionModal({ open: true, asset, newUrl: '', notes: '' })}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition flex items-center gap-1 shadow-2xs"
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

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD NEW DESIGN DRAWING (Section 9B, C, D, E, F)                 */}
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
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy-950 text-base">Upload Design Drawing / Render</h3>
                    <span className="text-[10px] text-slate-400">Routes strictly to BuildGhar Admin Review</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
                {/* Project Selector */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Project</label>
                  <select
                    value={uploadData.projectId}
                    onChange={(e) => setUploadData({ ...uploadData, projectId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-bold bg-slate-50"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectId} - {p.title} ({p.customerName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category & Room */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category (Section 9)</label>
                    <select
                      value={uploadData.category}
                      onChange={(e) => setUploadData({ ...uploadData, category: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-medium bg-slate-50"
                    >
                      <option value="SPACE_PLANNING">9B. Space Planning (Layout)</option>
                      <option value="LAYOUT_2D">9C. 2D Working CAD Plan</option>
                      <option value="VISUALIZATION_3D">9D. 3D Photorealistic Render</option>
                      <option value="MATERIAL_FINISHES">9E. Material & Finish Palette</option>
                      <option value="MOOD_BOARD">Moodboard & Swatches</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Room / Space</label>
                    <select
                      value={uploadData.roomName}
                      onChange={(e) => setUploadData({ ...uploadData, roomName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-medium bg-slate-50"
                    >
                      <option value="Living Room">Living Room</option>
                      <option value="Modular Kitchen">Modular Kitchen</option>
                      <option value="Master Bedroom Suite">Master Bedroom Suite</option>
                      <option value="Kids Bedroom">Kids Bedroom</option>
                      <option value="Dining Area">Dining Area</option>
                      <option value="Foyer & Entrance">Foyer & Entrance</option>
                      <option value="Pooja Room">Pooja Room</option>
                      <option value="Full Home">Full Home</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Drawing / Render Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Living Room 4K Evening Lighting 3D Perspective"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-bold focus:border-blue-500"
                  />
                </div>

                {/* File URL */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">File URL / Secure Storage Reference</label>
                  <input
                    type="text"
                    placeholder="https://... or choose sample preset"
                    value={uploadData.fileUrl}
                    onChange={(e) => setUploadData({ ...uploadData, fileUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono text-xs focus:border-blue-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-400">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setUploadData({ ...uploadData, fileUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80' })}
                      className="text-[10px] text-blue-700 underline"
                    >
                      Luxury Living Render
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadData({ ...uploadData, fileUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=80' })}
                      className="text-[10px] text-blue-700 underline"
                    >
                      2D Kitchen Plan
                    </button>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Technical Specs & Dimensions</label>
                  <input
                    type="text"
                    value={uploadData.dimensionsOrSpecs}
                    onChange={(e) => setUploadData({ ...uploadData, dimensionsOrSpecs: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono text-xs focus:border-blue-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs flex items-center justify-between">
                  <span>Submit immediately to BuildGhar Admin for review</span>
                  <input
                    type="checkbox"
                    checked={uploadData.submitImmediately}
                    onChange={(e) => setUploadData({ ...uploadData, submitImmediately: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Submit</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW ASSET & TECHNICAL SPECS                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewAsset && (
          <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-700 text-xs bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {previewAsset.documentId}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">Version {previewAsset.version}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        previewAsset.clientApprovalStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : previewAsset.adminReviewStatus === 'REVISION_REQUESTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {previewAsset.clientApprovalStatus === 'APPROVED' ? 'CUSTOMER APPROVED' : previewAsset.adminReviewStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-navy-950 mt-1">{previewAsset.title}</h2>
                </div>
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Large Image Preview */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-[50vh] bg-slate-900 flex items-center justify-center">
                <img
                  src={previewAsset.fileUrl}
                  alt={previewAsset.title}
                  className="max-h-[50vh] w-auto object-contain"
                />
              </div>

              {/* Technical Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                  <span className="font-bold text-navy-950">{previewAsset.category.replace(/_/g, ' ')}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Room / Space</span>
                  <span className="font-bold text-navy-950">{previewAsset.roomName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Uploaded By</span>
                  <span className="font-bold text-navy-950">{previewAsset.uploadedBy}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">File Specs</span>
                  <span className="font-bold text-navy-950">{previewAsset.fileSize}</span>
                </div>
              </div>

              {previewAsset.dimensionsOrSpecs && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Rendering Engine & Specs</span>
                  <span className="font-mono text-slate-800">{previewAsset.dimensionsOrSpecs}</span>
                </div>
              )}

              {/* Revision remarks if present */}
              {previewAsset.adminFeedback && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950 block">Admin Feedback Remarks:</span>
                    <p className="text-amber-900 mt-0.5 leading-relaxed">{previewAsset.adminFeedback}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <a
                  href={previewAsset.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download High-Res</span>
                </a>

                {previewAsset.adminReviewStatus === 'REVISION_REQUESTED' && (
                  <button
                    onClick={() => {
                      setRevisionModal({ open: true, asset: previewAsset, newUrl: '', notes: '' });
                      setPreviewAsset(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Create Revision v2.0</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: REVISE DESIGN ASSET (VERSION CONTROL)                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {revisionModal.open && revisionModal.asset && (
          <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy-950 text-sm">Submit Design Revision</h3>
                    <span className="font-mono text-[10px] text-slate-400">
                      {revisionModal.asset.documentId} • Current: {revisionModal.asset.version}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setRevisionModal({ open: false, asset: null, newUrl: '', notes: '' })}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                A new major version will be created (e.g. <strong>v2.0</strong>). The earlier version will be permanently preserved in version history.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">New Revised File URL</label>
                  <input
                    type="text"
                    placeholder="Enter revised CAD/Render URL..."
                    value={revisionModal.newUrl}
                    onChange={(e) => setRevisionModal({ ...revisionModal, newUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono text-xs focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Revision Notes for Admin & Client</label>
                  <textarea
                    placeholder="Describe changes made per feedback..."
                    value={revisionModal.notes}
                    onChange={(e) => setRevisionModal({ ...revisionModal, notes: e.target.value })}
                    className="w-full h-20 p-2.5 rounded-xl border border-slate-200 text-navy-950 text-xs focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setRevisionModal({ open: false, asset: null, newUrl: '', notes: '' })}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRevision}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Revision</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
