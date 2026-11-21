import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  getInteriorDesignAssets,
  InteriorDesignAsset,
  getInteriorProjects,
} from '../../data/interiorDesignerStore.js';

export const InteriorDesignerDesignStudio: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<InteriorDesignAsset[]>(() => getInteriorDesignAssets());
  const projects = getInteriorProjects();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [previewAsset, setPreviewAsset] = useState<InteriorDesignAsset | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<InteriorDesignAsset['category']>('3D_RENDER');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || 'prj-int-1');
  const [newVersion, setNewVersion] = useState('v1.0');
  const [newFileUrl, setNewFileUrl] = useState('');

  const filteredAssets = assets.filter((a) => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
    if (selectedProject !== 'ALL' && a.projectId !== selectedProject) return false;
    return true;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProj = projects.find((p) => p.id === newProjectId);
    const created: InteriorDesignAsset = {
      id: `asset-${Date.now()}`,
      projectId: newProjectId,
      projectName: targetProj?.title || 'Interior Project',
      title: newTitle,
      category: newCategory,
      version: newVersion,
      fileUrl: newFileUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600',
      thumbnailUrl: newFileUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400',
      fileSize: '3.8 MB (PNG)',
      uploadedAt: new Date().toISOString(),
      clientApprovalStatus: 'PENDING',
    };

    const updatedList = [created, ...assets];
    setAssets(updatedList);
    try {
      localStorage.setItem('gd_interior_assets_v1', JSON.stringify(updatedList));
    } catch (e) {}

    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewFileUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Box className="w-3.5 h-3.5 text-blue-600" />
            <span>Photorealistic 3D Renders & CAD Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Design & Client Approvals
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Central repository for 2D plans, 4K 3D visualizations, mood boards, and client approvals.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Render / CAD</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All Assets' },
            { id: '3D_RENDER', label: '3D Visualizations' },
            { id: '2D_LAYOUT', label: '2D Working Plans' },
            { id: 'MOOD_BOARD', label: 'Mood Boards' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-semibold shrink-0">Filter by Project:</span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Design Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Image Preview Container */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badges on Top */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-900 font-mono text-[10px] font-black uppercase">
                    {asset.version}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-white font-mono text-[10px] font-black uppercase">
                    {asset.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                      asset.clientApprovalStatus === 'APPROVED'
                        ? 'bg-emerald-500/90 text-white'
                        : asset.clientApprovalStatus === 'REVISION_REQUESTED'
                        ? 'bg-rose-500/90 text-white'
                        : 'bg-amber-500/90 text-white'
                    }`}
                  >
                    {asset.clientApprovalStatus === 'APPROVED' && 'Client Approved'}
                    {asset.clientApprovalStatus === 'PENDING' && 'Under Client Review'}
                    {asset.clientApprovalStatus === 'REVISION_REQUESTED' && 'Revision Needed'}
                  </span>
                </div>

                {/* Bottom Overlay Action */}
                <button
                  onClick={() => setPreviewAsset(asset)}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 shadow-sm transition flex items-center gap-1 text-xs font-bold"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Preview</span>
                </button>
              </div>

              {/* Card Meta */}
              <div className="p-5">
                <div className="text-[11px] font-bold text-blue-700 font-mono">
                  {asset.projectName}
                </div>
                <h4 className="text-sm font-black text-slate-900 mt-1 line-clamp-2 leading-tight">
                  {asset.title}
                </h4>

                {asset.clientFeedback && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-0.5">
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                      <span>Client Remarks:</span>
                    </div>
                    <div className="text-slate-600 text-[11px] italic">
                      "{asset.clientFeedback}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>{asset.fileSize}</span>
              <a
                href={asset.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-700 font-bold flex items-center gap-1 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox / Preview Modal */}
      <AnimatePresence>
        {previewAsset && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800 text-white"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-400 font-mono font-bold">
                    {previewAsset.projectName} • {previewAsset.version}
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">{previewAsset.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[70vh] bg-black flex items-center justify-center p-2">
                <img
                  src={previewAsset.fileUrl}
                  alt={previewAsset.title}
                  className="max-h-[68vh] object-contain rounded-xl"
                />
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Status: <strong className="text-white">{previewAsset.clientApprovalStatus}</strong></span>
                <a
                  href={previewAsset.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download High-Res Original</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Upload Design Asset</span>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Select Project *</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Asset Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="3D_RENDER">3D Visualization Render (4K)</option>
                    <option value="2D_LAYOUT">2D Floor Plan / Working CAD</option>
                    <option value="MOOD_BOARD">Material & Mood Board</option>
                    <option value="CEILING_LIGHTING">False Ceiling & Electrical Layout</option>
                    <option value="ELEVATION">Joinery & Wall Elevation</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Version Tag *</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Title / Room *</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Image / Render URL (or Demo Preview)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Leave blank to use photorealistic high-res sample interior render.
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Upload & Request Customer Approval
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
