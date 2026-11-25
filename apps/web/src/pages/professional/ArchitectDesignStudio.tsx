import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Compass,
  FileUp,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Plus,
  Layers,
  Filter,
  Search,
  FileText,
  Building,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  X,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  getArchitectDesigns,
  saveArchitectDesign,
  updateArchitectDesignStatus,
  addDesignVersion,
  ArchitecturalDesign,
  DesignCategory,
  DesignStatus,
} from '../../data/architectPanelStore.js';

export const ArchitectDesignStudio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [designs, setDesigns] = useState<ArchitecturalDesign[]>(() => getArchitectDesigns());
  const [projects] = useState(() => getExecutionProjects());

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(searchParams.get('action') === 'upload');
  const [selectedDesignForVersions, setSelectedDesignForVersions] = useState<ArchitecturalDesign | null>(null);
  const [selectedDesignForRevision, setSelectedDesignForRevision] = useState<ArchitecturalDesign | null>(null);

  // New Design Form state
  const [formData, setFormData] = useState<{
    projectId: string;
    category: DesignCategory;
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    fileSize: string;
    fileType: 'PDF' | 'JPG' | 'PNG' | 'DWG' | 'DXF';
    revisionNotes: string;
  }>({
    projectId: projects[0]?.id || '',
    category: 'HOUSE_MAP',
    title: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    fileType: 'PDF',
    revisionNotes: 'Initial architectural submission v1.0',
  });

  // Revision Form state
  const [revisionForm, setRevisionForm] = useState({
    fileUrl: '',
    fileName: '',
    fileSize: '',
    revisionNotes: '',
  });

  const reloadDesigns = () => {
    setDesigns(getArchitectDesigns());
  };

  useEffect(() => {
    window.addEventListener('storage', reloadDesigns);
    return () => window.removeEventListener('storage', reloadDesigns);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toUpperCase() as any;
    const recognizedType = ['PDF', 'JPG', 'PNG', 'DWG', 'DXF'].includes(ext) ? ext : 'PDF';
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        fileUrl: reader.result as string,
        fileName: file.name,
        fileSize: sizeStr,
        fileType: recognizedType,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRevisionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const reader = new FileReader();
    reader.onload = () => {
      setRevisionForm((prev) => ({
        ...prev,
        fileUrl: reader.result as string,
        fileName: file.name,
        fileSize: sizeStr,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.fileUrl) {
      alert('Please provide design title and upload a design file.');
      return;
    }

    const selectedProj = projects.find((p) => p.id === formData.projectId) || projects[0];

    const newDesign: ArchitecturalDesign = {
      id: `DSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: selectedProj?.id || 'PROJ-DEFAULT',
      projectTitle: selectedProj?.title || 'Residential Architectural Project',
      customerId: selectedProj?.customerId || 'CUST-DEFAULT',
      customerName: selectedProj?.customerName || 'Project Homeowner',
      category: formData.category,
      title: formData.title,
      description: formData.description,
      fileUrl: formData.fileUrl,
      fileName: formData.fileName || 'design-drawing.pdf',
      fileSize: formData.fileSize || '1.20 MB',
      fileType: formData.fileType,
      currentVersion: 'v1.0',
      status: 'SUBMITTED_TO_ADMIN',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revisionNotes: formData.revisionNotes,
      versions: [
        {
          versionNumber: 'v1.0',
          fileUrl: formData.fileUrl,
          fileName: formData.fileName || 'design-drawing.pdf',
          fileSize: formData.fileSize || '1.20 MB',
          uploadedAt: new Date().toISOString(),
          revisionNotes: formData.revisionNotes,
          status: 'SUBMITTED_TO_ADMIN',
        },
      ],
    };

    saveArchitectDesign(newDesign);
    reloadDesigns();
    setIsUploadOpen(false);
    setFormData({
      projectId: projects[0]?.id || '',
      category: 'HOUSE_MAP',
      title: '',
      description: '',
      fileUrl: '',
      fileName: '',
      fileSize: '',
      fileType: 'PDF',
      revisionNotes: 'Initial architectural submission v1.0',
    });
  };

  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesignForRevision || !revisionForm.fileUrl || !revisionForm.revisionNotes) {
      alert('Please upload revised drawing file and enter revision notes.');
      return;
    }

    addDesignVersion(selectedDesignForRevision.id, {
      fileUrl: revisionForm.fileUrl,
      fileName: revisionForm.fileName || 'revised-drawing.pdf',
      fileSize: revisionForm.fileSize || '1.50 MB',
      revisionNotes: revisionForm.revisionNotes,
    });

    reloadDesigns();
    setSelectedDesignForRevision(null);
    setRevisionForm({ fileUrl: '', fileName: '', fileSize: '', revisionNotes: '' });
  };

  // Filter designs
  const filteredDesigns = designs.filter((d) => {
    if (selectedProjectId !== 'ALL' && d.projectId !== selectedProjectId) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!d.title.toLowerCase().includes(q) && !d.fileName.toLowerCase().includes(q)) return false;
    }

    if (activeTab === 'house-maps') {
      return (
        d.category === 'HOUSE_MAP' ||
        d.category === 'FLOOR_PLAN_GROUND' ||
        d.category === 'FLOOR_PLAN_FIRST' ||
        d.category === 'FLOOR_PLAN_MULTI'
      );
    }
    if (activeTab === 'drawings-2d') {
      return d.category === 'DRAWING_2D' || d.category === 'SECTION_DRAWINGS' || d.category === 'SITE_LAYOUT';
    }
    if (activeTab === 'elevation-3d') {
      return d.category === 'ELEVATION_3D';
    }
    if (activeTab === 'working-structural') {
      return (
        d.category === 'WORKING_DRAWINGS' ||
        d.category === 'STRUCTURAL_COORDINATION' ||
        d.category === 'RENOVATION_DRAWING'
      );
    }
    if (activeTab === 'approvals') {
      return (
        d.status === 'PENDING_CUSTOMER_APPROVAL' ||
        d.status === 'SUBMITTED_TO_ADMIN' ||
        d.status === 'REVISION_REQUESTED'
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-sky-500/20 text-sky-200 border border-sky-400/30 uppercase tracking-wider font-mono">
                Section 5 & 10 Architecture Studio
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Multi-tier Verification Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Architectural Design Management Studio
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/80 max-w-2xl mt-1 leading-relaxed">
              Create house maps, manage 2D technical drawings, 3D elevations, structural coordination files, and submit designs through multi-stage Admin and Homeowner approvals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white text-sky-950 font-black text-xs hover:bg-sky-50 transition shadow-lg flex items-center gap-2"
            >
              <FileUp className="w-4 h-4 text-sky-600" />
              <span>Upload New Design Drawing</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & CATEGORY NAVIGATION TABS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b sm:border-b-0 pb-2 sm:pb-0 border-slate-100">
            {[
              { id: 'all', label: 'All Designs' },
              { id: 'house-maps', label: '5.1 House Maps & Floor Plans' },
              { id: 'drawings-2d', label: '5.2 2D & Section Drawings' },
              { id: 'elevation-3d', label: '5.2 3D Elevations' },
              { id: 'working-structural', label: '5.2 Working & Structural' },
              { id: 'approvals', label: '5.5 Approvals & Revisions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Project Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Active Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.code} ({p.customerName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search drawings by title or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* DESIGNS GRID LIST */}
      {filteredDesigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDesigns.map((dsg) => {
            const isApproved = dsg.status === 'APPROVED';
            const isRevision = dsg.status === 'REVISION_REQUESTED';
            const isPending =
              dsg.status === 'PENDING_CUSTOMER_APPROVAL' || dsg.status === 'SUBMITTED_TO_ADMIN';

            return (
              <div
                key={dsg.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* File Preview Area */}
                  <div className="h-44 bg-slate-100 border-b border-slate-200 relative group flex items-center justify-center overflow-hidden">
                    {dsg.fileUrl.startsWith('data:image') || dsg.fileUrl.endsWith('.jpg') || dsg.fileUrl.endsWith('.png') ? (
                      <img
                        src={dsg.fileUrl}
                        alt={dsg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <FileText className="w-12 h-12 mb-2 text-sky-600" />
                        <span className="text-xs font-bold text-slate-700">{dsg.fileName}</span>
                        <span className="text-[10px] text-slate-400">{dsg.fileType} Document • {dsg.fileSize}</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-navy-950/80 backdrop-blur-sm text-white font-mono text-[10px] font-bold">
                        {dsg.currentVersion}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold">
                        {dsg.category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <Badge
                        variant={isApproved ? 'success' : isRevision ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {dsg.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-navy-950 line-clamp-1">{dsg.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {dsg.description || 'Architectural deliverable submitted for review and approval.'}
                    </p>

                    <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 space-y-1">
                      <div className="flex justify-between">
                        <span>Project:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                          {dsg.projectTitle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Client:</span>
                        <span className="font-semibold text-slate-800">{dsg.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uploaded:</span>
                        <span>{new Date(dsg.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {dsg.customerComments && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 mt-2">
                        <span className="font-bold">Customer Feedback:</span> {dsg.customerComments}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDesignForVersions(dsg)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition"
                      title="View Revision History"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dsg.versions.length} Ver</span>
                    </button>

                    <a
                      href={dsg.fileUrl}
                      download={dsg.fileName}
                      className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                      title="Download Original File"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDesignForRevision(dsg)}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition flex items-center gap-1"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>New Revision</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-navy-950">No Architectural Designs Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No design files matched the selected filter or project. Upload a floor plan, 3D elevation, or working drawing to begin.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-sm transition inline-flex items-center gap-2"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload First Architectural Drawing</span>
          </button>
        </div>
      )}

      {/* UPLOAD NEW DESIGN MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-950">Upload Architectural Design</h3>
                <p className="text-xs text-slate-500">
                  Submissions are routed to Admin & Customer for verified review
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDesign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.code} • {p.customerName}
                    </option>
                  ))}
                  {projects.length === 0 && <option value="DEFAULT">General Architectural Design</option>}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Design Category (5.1 - 5.2)</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="HOUSE_MAP">House Map</option>
                    <option value="FLOOR_PLAN_GROUND">Ground Floor Plan</option>
                    <option value="FLOOR_PLAN_FIRST">First Floor Plan</option>
                    <option value="FLOOR_PLAN_MULTI">Multi-floor Plan</option>
                    <option value="DRAWING_2D">2D Architectural Drawing</option>
                    <option value="ELEVATION_3D">3D Elevation</option>
                    <option value="SITE_LAYOUT">Site Layout</option>
                    <option value="SECTION_DRAWINGS">Section Drawings</option>
                    <option value="STRUCTURAL_COORDINATION">Structural Coordination</option>
                    <option value="WORKING_DRAWINGS">Working Drawings</option>
                    <option value="RENOVATION_DRAWING">Renovation Drawings</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drawing Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ground Floor Plan 30x50 East Facing"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Details about setbacks, room dimensions, load-bearing grid..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Design File (PDF, JPG, PNG, DWG, DXF)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-sky-500 transition cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                  />
                  {formData.fileName && (
                    <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{formData.fileName} ({formData.fileSize})</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Revision Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Initial concept v1.0 based on homeowner brief"
                  value={formData.revisionNotes}
                  onChange={(e) => setFormData({ ...formData, revisionNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 shadow-md transition flex items-center gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Submit to Admin for Customer Release</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {selectedDesignForVersions && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedDesignForVersions(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-950">Design Version History (5.4)</h3>
                <p className="text-xs text-slate-500">{selectedDesignForVersions.title}</p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedDesignForVersions.versions.map((ver, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-navy-950 text-white font-mono text-xs font-bold">
                        {ver.versionNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{ver.fileName}</span>
                      <span className="text-[10px] text-slate-400">({ver.fileSize})</span>
                    </div>
                    <p className="text-xs text-slate-600">{ver.revisionNotes}</p>
                    <div className="text-[10px] text-slate-400">
                      Uploaded on {new Date(ver.uploadedAt).toLocaleString()}
                    </div>
                  </div>

                  <a
                    href={ver.fileUrl}
                    download={ver.fileName}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW REVISION UPLOAD MODAL */}
      {selectedDesignForRevision && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedDesignForRevision(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-950">Upload Design Revision (5.4)</h3>
                <p className="text-xs text-slate-500">Target: {selectedDesignForRevision.title}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Revised File (PDF / Drawing)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-sky-500 transition cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                    onChange={handleRevisionFileUpload}
                    required
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700"
                  />
                  {revisionForm.fileName && (
                    <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{revisionForm.fileName} ({revisionForm.fileSize})</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Revision Notes & Changes Made
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail modifications addressed per client feedback..."
                  value={revisionForm.revisionNotes}
                  onChange={(e) => setRevisionForm({ ...revisionForm, revisionNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDesignForRevision(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 shadow-md transition flex items-center gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Submit Revision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
