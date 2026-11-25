import React, { useState, useEffect, useMemo } from 'react';
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
  Share2,
  Check,
  RotateCw,
  ExternalLink,
  Sliders,
  Sparkles,
  Maximize2,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  FolderDown,
  Info,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import { getExecutionProjects, ExecutionProject } from '../../data/projectExecutionStore.js';
import {
  getArchitectDesigns,
  saveArchitectDesign,
  updateArchitectDesignStatus,
  addDesignVersion,
  ArchitecturalDesign,
  DesignCategory,
  DesignStatus,
  DesignVersionItem,
} from '../../data/architectPanelStore.js';
import { formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';

type TabType = 'floor-plan' | 'drawings' | 'files' | 'versions' | 'approvals';

export const ArchitectDesignStudio: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  // Normalize query param to matching tab
  const rawTab = searchParams.get('tab');
  const activeTab: TabType = useMemo(() => {
    if (rawTab === 'house-maps' || rawTab === 'floor-plan') return 'floor-plan';
    if (rawTab === 'drawings-2d' || rawTab === 'elevation-3d' || rawTab === 'working-structural' || rawTab === 'drawings') return 'drawings';
    if (rawTab === 'files') return 'files';
    if (rawTab === 'versions') return 'versions';
    if (rawTab === 'approvals') return 'approvals';
    return 'floor-plan';
  }, [rawTab]);

  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects] = useState<ExecutionProject[]>(() => {
    const list = getExecutionProjects();
    if (list.length > 0) return list;
    return [
      {
        id: 'PRJ-2026-ARCH-01',
        requestCode: 'GHR-REQ-2026-0011',
        workOrderNumber: 'GHR-WO-2026-088',
        name: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        customerPhone: '+91 9876543210',
        propertyAddress: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
        city: 'Indore',
      } as any,
    ];
  });

  // Seed realistic architectural designs if store is empty
  const ensureArchitecturalDesigns = (): ArchitecturalDesign[] => {
    const stored = getArchitectDesigns();
    if (stored.length > 0) return stored;

    const defaultDesigns: ArchitecturalDesign[] = [
      {
        id: 'DSG-IND-01',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerId: 'CUST-IND-992',
        customerName: 'Sharika Mishra',
        category: 'HOUSE_MAP',
        title: 'Vastu Ground Floor Architectural Plan (30x50 ft - North Facing)',
        description: 'Vastu-compliant G+2 ground layout with double-height living room, pooja in North-East, and kitchen in South-East.',
        fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        fileName: 'Ground_Floor_Plan_v2.0_Final.pdf',
        fileSize: '3.40 MB',
        fileType: 'PDF',
        currentVersion: 'v2.0',
        status: 'APPROVED',
        uploadedAt: '2026-11-10T10:00:00Z',
        updatedAt: '2026-11-18T14:30:00Z',
        revisionNotes: 'Relocated kitchen to South-East Agni corner and enlarged master bedroom wardrobe.',
        customerComments: 'Approved by Sharika Mishra. Layout matches our family requirements perfectly.',
        adminReviewNotes: 'Complies with Indore Master Plan 2021 setbacks and ground coverage norms.',
        approvedAt: '2026-11-19T09:15:00Z',
        versions: [
          {
            versionNumber: 'v1.0',
            fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            fileName: 'Ground_Floor_Plan_v1.0.pdf',
            fileSize: '3.10 MB',
            uploadedAt: '2026-11-10T10:00:00Z',
            revisionNotes: 'Initial concept zoning floor plan.',
            status: 'REVISION_REQUESTED',
            customerComments: 'Please move kitchen closer to the utility area and recheck Vastu orientation.',
          },
          {
            versionNumber: 'v2.0',
            fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            fileName: 'Ground_Floor_Plan_v2.0_Final.pdf',
            fileSize: '3.40 MB',
            uploadedAt: '2026-11-18T14:30:00Z',
            revisionNotes: 'Kitchen placed in SE Agni kon, utility corridor broadened.',
            status: 'APPROVED',
            customerComments: 'Approved! Everything looks perfect.',
          },
        ],
      },
      {
        id: 'DSG-IND-02',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerId: 'CUST-IND-992',
        customerName: 'Sharika Mishra',
        category: 'ELEVATION_3D',
        title: 'Photorealistic 3D Facade Rendering & Daylight Study',
        description: 'Contemporary facade with Italian travertine cladding, vertical aluminum louvers, and warm ambient evening lighting.',
        fileUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        fileName: 'Villa_3D_Facade_Render_v1.1.png',
        fileSize: '8.25 MB',
        fileType: 'PNG',
        currentVersion: 'v1.1',
        status: 'PENDING_CUSTOMER_APPROVAL',
        uploadedAt: '2026-11-20T11:00:00Z',
        updatedAt: '2026-11-22T16:00:00Z',
        revisionNotes: 'Adjusted wood texture on terrace pergola per client preference.',
        customerComments: 'Reviewing terracotta texture vs grey stone with family.',
        versions: [
          {
            versionNumber: 'v1.0',
            fileUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
            fileName: 'Villa_3D_Facade_Render_v1.0.png',
            fileSize: '7.80 MB',
            uploadedAt: '2026-11-20T11:00:00Z',
            revisionNotes: 'Initial high-res exterior rendering.',
            status: 'REVISION_REQUESTED',
          },
          {
            versionNumber: 'v1.1',
            fileUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
            fileName: 'Villa_3D_Facade_Render_v1.1.png',
            fileSize: '8.25 MB',
            uploadedAt: '2026-11-22T16:00:00Z',
            revisionNotes: 'Updated pergola louvers to dark walnut finish.',
            status: 'PENDING_CUSTOMER_APPROVAL',
          },
        ],
      },
      {
        id: 'DSG-IND-03',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerId: 'CUST-IND-992',
        customerName: 'Sharika Mishra',
        category: 'STRUCTURAL_COORDINATION',
        title: 'IS 456 Column-Beam Layout & Ductile Detailing Sheet (Zone III)',
        description: 'M25 grade concrete and Fe500D TMT bar scheduling. Ductile detailing per IS 13920 for seismic resilience.',
        fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
        fileName: 'IS456_Structural_Column_Grid_v1.0.dwg',
        fileSize: '5.10 MB',
        fileType: 'DWG',
        currentVersion: 'v1.0',
        status: 'APPROVED',
        uploadedAt: '2026-11-21T09:00:00Z',
        updatedAt: '2026-11-21T09:00:00Z',
        revisionNotes: 'Verified by Er. Anil Sharma, Chartered Structural Engineer.',
        adminReviewNotes: 'Complies with National Building Code (NBC 2016) Part 6.',
        versions: [
          {
            versionNumber: 'v1.0',
            fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
            fileName: 'IS456_Structural_Column_Grid_v1.0.dwg',
            fileSize: '5.10 MB',
            uploadedAt: '2026-11-21T09:00:00Z',
            revisionNotes: 'Initial structural vetting release.',
            status: 'APPROVED',
          },
        ],
      },
      {
        id: 'DSG-IND-04',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerId: 'CUST-IND-992',
        customerName: 'Sharika Mishra',
        category: 'WORKING_DRAWINGS',
        title: 'MEP Internal Plumbing, Drainage & Rainwater Harvesting Layout',
        description: 'Complete soil, waste, and vent pipe (SVP) layout with inspection chambers and rooftop rainwater collection cistern.',
        fileUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
        fileName: 'MEP_Plumbing_Rainwater_Harvesting_v1.0.pdf',
        fileSize: '4.60 MB',
        fileType: 'PDF',
        currentVersion: 'v1.0',
        status: 'SUBMITTED_TO_ADMIN',
        uploadedAt: '2026-11-23T15:00:00Z',
        updatedAt: '2026-11-23T15:00:00Z',
        revisionNotes: 'Submitted for Admin technical audit.',
        versions: [
          {
            versionNumber: 'v1.0',
            fileUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
            fileName: 'MEP_Plumbing_Rainwater_Harvesting_v1.0.pdf',
            fileSize: '4.60 MB',
            uploadedAt: '2026-11-23T15:00:00Z',
            revisionNotes: 'First submission to Admin audit queue.',
            status: 'SUBMITTED_TO_ADMIN',
          },
        ],
      },
    ];

    defaultDesigns.forEach((d) => saveArchitectDesign(d));
    return defaultDesigns;
  };

  const [designs, setDesigns] = useState<ArchitecturalDesign[]>(ensureArchitecturalDesigns);

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(searchParams.get('action') === 'upload');
  const [selectedDesignForVersions, setSelectedDesignForVersions] = useState<ArchitecturalDesign | null>(null);
  const [selectedDesignForRevision, setSelectedDesignForRevision] = useState<ArchitecturalDesign | null>(null);
  const [previewDesign, setPreviewDesign] = useState<ArchitecturalDesign | null>(null);

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
      error('Please provide a drawing title and upload a design file.');
      return;
    }

    const selectedProj = projects.find((p) => p.id === formData.projectId) || projects[0];

    const newDesign: ArchitecturalDesign = {
      id: `DSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: selectedProj?.id || 'PROJ-DEFAULT',
      projectTitle: selectedProj?.name || (selectedProj as any)?.title || 'Residential Architectural Project',
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
    success(`Drawing "${formData.title}" uploaded and queued for Admin & Homeowner verification!`);
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
      error('Please upload revised drawing file and enter revision notes.');
      return;
    }

    addDesignVersion(selectedDesignForRevision.id, {
      fileUrl: revisionForm.fileUrl,
      fileName: revisionForm.fileName || 'revised-drawing.pdf',
      fileSize: revisionForm.fileSize || '1.50 MB',
      revisionNotes: revisionForm.revisionNotes,
    });

    reloadDesigns();
    success(`New revision published for "${selectedDesignForRevision.title}"!`);
    setSelectedDesignForRevision(null);
    setRevisionForm({ fileUrl: '', fileName: '', fileSize: '', revisionNotes: '' });
  };

  // Filter designs based on active tab and search
  const filteredDesigns = useMemo(() => {
    return designs.filter((d) => {
      if (selectedProjectId !== 'ALL' && d.projectId !== selectedProjectId) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!d.title.toLowerCase().includes(q) && !d.fileName.toLowerCase().includes(q)) return false;
      }

      if (activeTab === 'floor-plan') {
        return (
          d.category === 'HOUSE_MAP' ||
          d.category === 'FLOOR_PLAN_GROUND' ||
          d.category === 'FLOOR_PLAN_FIRST' ||
          d.category === 'FLOOR_PLAN_MULTI'
        );
      }
      if (activeTab === 'drawings') {
        return (
          d.category === 'DRAWING_2D' ||
          d.category === 'ELEVATION_3D' ||
          d.category === 'SECTION_DRAWINGS' ||
          d.category === 'SITE_LAYOUT' ||
          d.category === 'STRUCTURAL_COORDINATION' ||
          d.category === 'WORKING_DRAWINGS' ||
          d.category === 'RENOVATION_DRAWING'
        );
      }
      if (activeTab === 'files') {
        return true; // All CAD/PDF technical files
      }
      if (activeTab === 'versions') {
        return d.versions && d.versions.length >= 1;
      }
      if (activeTab === 'approvals') {
        return (
          d.status === 'PENDING_CUSTOMER_APPROVAL' ||
          d.status === 'SUBMITTED_TO_ADMIN' ||
          d.status === 'REVISION_REQUESTED' ||
          d.status === 'APPROVED'
        );
      }

      return true;
    });
  }, [designs, activeTab, selectedProjectId, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 5)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <Compass className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  5. Architecture Design Studio & Versioning
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  {designs.length} Sheets Vetted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                CAD floor plans, 3D elevations, IS 456 structural coordination, and multi-tier Homeowner & Admin approvals.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Upload Action */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload Design Sheet</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5 SUB-NAVIGATION TABS (5.1 to 5.5)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('floor-plan')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'floor-plan'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>5.1 House Map / Floor Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('drawings')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'drawings'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>5.2 Architectural Drawings (2D/3D)</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'files'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderDown className="w-4 h-4" />
            <span>5.3 Design Files (CAD/BIM)</span>
          </button>

          <button
            onClick={() => setActiveTab('versions')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'versions'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>5.4 Version Management</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>5.5 Design Approvals & Sign-offs</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          FILTERS & SEARCH BAR
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Active Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || (p as any).title} ({p.customerName})
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sheets by title, category, or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* =========================================================================
          DESIGNS GRID (CARDS WITH HIGH-RES PREVIEWS & ACTIONS)
      ========================================================================= */}
      {filteredDesigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDesigns.map((dsg) => {
            const isApproved = dsg.status === 'APPROVED';
            const isRevision = dsg.status === 'REVISION_REQUESTED';

            return (
              <div
                key={dsg.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* File Preview Area */}
                  <div
                    onClick={() => setPreviewDesign(dsg)}
                    className="h-44 bg-slate-100 border-b border-slate-200 relative group flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {dsg.fileUrl.startsWith('data:image') || dsg.fileUrl.includes('unsplash.com') || dsg.fileUrl.endsWith('.jpg') || dsg.fileUrl.endsWith('.png') ? (
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                        isApproved
                          ? 'bg-blue-100 text-blue-900'
                          : isRevision
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {dsg.status}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-navy-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-white text-navy-950 font-bold text-xs shadow-lg flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Inspect Sheet</span>
                      </span>
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
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {dsg.projectTitle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Client:</span>
                        <span className="font-semibold text-slate-800">{dsg.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span className="font-mono">{formatDate(dsg.updatedAt)}</span>
                      </div>
                    </div>

                    {dsg.customerComments && (
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/80 text-[11px] text-blue-950 mt-2">
                        <span className="font-bold">Client Feedback:</span> {dsg.customerComments}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDesignForVersions(dsg)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
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
                      className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload First Architectural Drawing</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: UPLOAD NEW DESIGN SHEET (5.1 & 5.2)
      ========================================================================= */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-950">Upload Architectural Design Sheet</h3>
                <p className="text-xs text-slate-500">
                  Submissions are routed to Admin & Homeowner for verified review
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDesign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-hidden"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || (p as any).title} • {p.customerName}
                    </option>
                  ))}
                  {projects.length === 0 && <option value="DEFAULT">General Architectural Project</option>}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Design Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-hidden"
                  >
                    <option value="HOUSE_MAP">House Map / Master Layout</option>
                    <option value="FLOOR_PLAN_GROUND">Ground Floor Plan</option>
                    <option value="FLOOR_PLAN_FIRST">First Floor Plan</option>
                    <option value="FLOOR_PLAN_MULTI">Multi-Floor Plan</option>
                    <option value="DRAWING_2D">2D Architectural Drawing</option>
                    <option value="ELEVATION_3D">3D Elevation Render</option>
                    <option value="SITE_LAYOUT">Site Layout & Setbacks</option>
                    <option value="SECTION_DRAWINGS">Sectional Cross-Cut</option>
                    <option value="STRUCTURAL_COORDINATION">Structural Coordination (IS 456)</option>
                    <option value="WORKING_DRAWINGS">Working Drawings (MEP)</option>
                    <option value="RENOVATION_DRAWING">Renovation Layout</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drawing Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ground Floor Plan 30x50 East Facing"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Detail dimensional specs, Vastu guidelines, materials, or structural notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Upload File (PDF, PNG, JPG, DWG, DXF) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600 cursor-pointer"
                />
                {formData.fileName && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-blue-900 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Attached: {formData.fileName} ({formData.fileSize})</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VERSION HISTORY INSPECTOR (5.4)
      ========================================================================= */}
      {selectedDesignForVersions && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedDesignForVersions(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-950">
                  Version History: {selectedDesignForVersions.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Chronological revisions, client feedback, and architectural diffs
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {selectedDesignForVersions.versions.map((ver, idx) => (
                <div
                  key={ver.versionNumber || idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-white bg-navy-950 px-2 py-0.5 rounded-md">
                        {ver.versionNumber}
                      </span>
                      <span className="font-bold text-slate-800">{ver.fileName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({ver.fileSize})</span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDate(ver.uploadedAt)}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed font-sans">
                    <strong>Changelog:</strong> {ver.revisionNotes || 'Routine revision update.'}
                  </p>

                  {ver.customerComments && (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-950">
                      <span className="font-bold">Homeowner Comment:</span> {ver.customerComments}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <a
                      href={ver.fileUrl}
                      download={ver.fileName}
                      className="text-xs font-bold text-sky-800 hover:text-sky-900 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {ver.versionNumber}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: SUBMIT NEW REVISION (5.4)
      ========================================================================= */}
      {selectedDesignForRevision && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedDesignForRevision(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-950">
                  Publish New Revision
                </h3>
                <p className="text-xs text-slate-500">
                  Updating: <strong>{selectedDesignForRevision.title}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Revised Drawing Sheet *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf"
                  onChange={handleRevisionFileUpload}
                  className="w-full px-3 py-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600 cursor-pointer"
                />
                {revisionForm.fileName && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-blue-900 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Attached: {revisionForm.fileName} ({revisionForm.fileSize})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Revision Notes & Changelog *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail what changes were incorporated (e.g. Enlarged master bed, adjusted balcony cantilever per client request)..."
                  value={revisionForm.revisionNotes}
                  onChange={(e) => setRevisionForm({ ...revisionForm, revisionNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedDesignForRevision(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Publish Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: FULL-SCREEN DESIGN INSPECTOR MODAL
      ========================================================================= */}
      {previewDesign && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md">
                    {previewDesign.currentVersion}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-white">{previewDesign.title}</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {previewDesign.projectTitle} • Client: {previewDesign.customerName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDesign.fileUrl}
                  download={previewDesign.fileName}
                  className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewDesign(null)}
                  className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex items-center justify-center">
              {previewDesign.fileUrl.startsWith('data:image') || previewDesign.fileUrl.includes('unsplash.com') || previewDesign.fileUrl.endsWith('.jpg') || previewDesign.fileUrl.endsWith('.png') ? (
                <img
                  src={previewDesign.fileUrl}
                  alt={previewDesign.title}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg border border-slate-300"
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center space-y-3 max-w-md">
                  <FileText className="w-16 h-16 text-sky-600 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-sm">{previewDesign.fileName}</h4>
                  <p className="text-xs text-slate-500">
                    Technical vector CAD / PDF drawings can be downloaded directly for high-precision plotting or viewed in desktop CAD tools.
                  </p>
                  <a
                    href={previewDesign.fileUrl}
                    download={previewDesign.fileName}
                    className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Technical Sheet</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer with Details */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
              <div className="text-slate-600">
                <span>Category: <strong>{previewDesign.category.replace(/_/g, ' ')}</strong></span>
                <span className="mx-2">•</span>
                <span>Size: <strong>{previewDesign.fileSize}</strong></span>
                <span className="mx-2">•</span>
                <span>Status: <strong className="text-blue-900">{previewDesign.status}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPreviewDesign(null);
                    setSelectedDesignForRevision(previewDesign);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold border border-sky-200 cursor-pointer"
                >
                  Upload New Revision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
