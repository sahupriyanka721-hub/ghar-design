import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  User,
  X,
  Share2,
  Check,
  Building,
  Filter,
  Eye,
  Download,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import { getExecutionProjects, ExecutionProject } from '../../data/projectExecutionStore.js';
import {
  getArchitectDeliverables,
  saveArchitectDeliverable,
  ArchitectDeliverable,
  DeliverableStatus,
  DeliverablePriority,
} from '../../data/architectPanelStore.js';
import { useToast } from '../../context/ToastContext.js';

type TabKey = 'milestones' | 'deliverables' | 'pending';

const ARCHITECTURAL_STAGES = [
  '1. Initial Client Brief & Consultation',
  '2. Site Measurement & Geo-demarcation',
  '3. Concept Floor Planning & Vastu Zoning',
  '4. Preliminary Floor Plan Revision',
  '5. Final Floor Plan Sign-off',
  '6. 2D Architectural & Sectional Drawings',
  '7. 3D Exterior Elevation & Facade Walkthrough',
  '8. Structural Coordination Drawings (IS 456)',
  '9. Architectural Working Drawings & MEP',
  '10. Final Municipal & Contractor Execution Package',
];

export const ArchitectDeliverables: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const tabParam = (searchParams.get('tab') as TabKey) || 'milestones';
  const activeTab: TabKey = useMemo(() => {
    if (tabParam === 'milestones' || tabParam === 'deliverables' || tabParam === 'pending') {
      return tabParam;
    }
    return 'milestones';
  }, [tabParam]);

  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

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

  // Seed default deliverables if none exist
  const ensureDefaultDeliverables = (): ArchitectDeliverable[] => {
    const existing = getArchitectDeliverables();
    if (existing.length > 0) return existing;

    const defaultItems: ArchitectDeliverable[] = [
      {
        id: 'DELIV-01',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        title: 'Concept Floor Planning & Vastu Zoning Layout',
        stageKey: ARCHITECTURAL_STAGES[2],
        description: 'Vastu orientation layout with North-East pooja and South-East kitchen placement.',
        assignedMember: 'Principal Architect',
        dueDate: '2026-11-15',
        priority: 'HIGH',
        status: 'COMPLETED',
        progressPercent: 100,
        revisionCount: 1,
        completedAt: '2026-11-14T16:00:00Z',
        attachments: [{ id: 'att-1', name: 'Concept_Vastu_Layout_v1.1.pdf', url: '#', uploadedAt: '2026-11-14' }],
        createdAt: '2026-11-05T09:00:00Z',
        updatedAt: '2026-11-14T16:00:00Z',
      },
      {
        id: 'DELIV-02',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        title: 'Final 2D Floor Plan Dimensional Schedules (G+2)',
        stageKey: ARCHITECTURAL_STAGES[4],
        description: 'Approved architectural floor layout with door/window schedules and room dimensions.',
        assignedMember: 'Lead Architect',
        dueDate: '2026-11-20',
        priority: 'HIGH',
        status: 'COMPLETED',
        progressPercent: 100,
        revisionCount: 2,
        completedAt: '2026-11-19T14:30:00Z',
        attachments: [{ id: 'att-2', name: 'Approved_Floor_Plan_v2.0.pdf', url: '#', uploadedAt: '2026-11-19' }],
        createdAt: '2026-11-10T10:00:00Z',
        updatedAt: '2026-11-19T14:30:00Z',
      },
      {
        id: 'DELIV-03',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        title: 'Photorealistic 3D Facade Rendering & Exterior Day/Night Views',
        stageKey: ARCHITECTURAL_STAGES[6],
        description: 'Contemporary facade modeling with stone cladding, aluminum vertical louvers, and lighting.',
        assignedMember: '3D Visualizer',
        dueDate: '2026-11-28',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        progressPercent: 75,
        revisionCount: 1,
        attachments: [{ id: 'att-3', name: 'Villa_3D_Render_Draft.png', url: '#', uploadedAt: '2026-11-22' }],
        createdAt: '2026-11-18T11:00:00Z',
        updatedAt: '2026-11-22T15:00:00Z',
      },
      {
        id: 'DELIV-04',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        title: 'Structural IS 456 Column-Beam Ductile Detailing Package',
        stageKey: ARCHITECTURAL_STAGES[7],
        description: 'M25 concrete mix, Fe550D reinforcement bar schedule, and foundation ductile detailing for Zone III.',
        assignedMember: 'Structural Consultant',
        dueDate: '2026-12-10',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        progressPercent: 40,
        revisionCount: 0,
        attachments: [{ id: 'att-4', name: 'Structural_Column_Grid_IS456.dwg', url: '#', uploadedAt: '2026-11-21' }],
        createdAt: '2026-11-20T09:00:00Z',
        updatedAt: '2026-11-21T18:00:00Z',
      },
      {
        id: 'DELIV-05',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        title: 'Internal Plumbing & MEP Electrical Conduit Drawings',
        stageKey: ARCHITECTURAL_STAGES[8],
        description: 'Water supply lines, drainage slope calculations, and rainwater harvesting cistern integration.',
        assignedMember: 'MEP Consultant',
        dueDate: '2026-12-20',
        priority: 'NORMAL',
        status: 'PENDING_REVIEW',
        progressPercent: 20,
        revisionCount: 0,
        attachments: [],
        createdAt: '2026-11-23T14:00:00Z',
        updatedAt: '2026-11-23T14:00:00Z',
      },
    ];

    defaultItems.forEach((it) => saveArchitectDeliverable(it));
    return defaultItems;
  };

  const [deliverables, setDeliverables] = useState<ArchitectDeliverable[]>(ensureDefaultDeliverables);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedForReview, setSelectedForReview] = useState<ArchitectDeliverable | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    projectId: string;
    title: string;
    stageKey: string;
    description: string;
    assignedMember: string;
    dueDate: string;
    priority: DeliverablePriority;
  }>({
    projectId: projects[0]?.id || '',
    title: '',
    stageKey: ARCHITECTURAL_STAGES[2],
    description: '',
    assignedMember: 'Principal Architect',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'HIGH',
  });

  const reloadDeliverables = () => {
    setDeliverables(getArchitectDeliverables());
  };

  useEffect(() => {
    window.addEventListener('storage', reloadDeliverables);
    return () => window.removeEventListener('storage', reloadDeliverables);
  }, []);

  const handleCreateDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    const selProj = projects.find((p) => p.id === formData.projectId) || projects[0];

    const newItem: ArchitectDeliverable = {
      id: `DELIV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: selProj?.id || 'PROJ-DEFAULT',
      projectTitle: selProj?.name || (selProj as any)?.title || 'Residential Architectural Project',
      customerName: selProj?.customerName || 'Homeowner',
      title: formData.title,
      stageKey: formData.stageKey,
      description: formData.description,
      assignedMember: formData.assignedMember,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: 'IN_PROGRESS',
      progressPercent: 20,
      revisionCount: 0,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveArchitectDeliverable(newItem);
    reloadDeliverables();
    setIsAddOpen(false);
    success(`Deliverable "${formData.title}" created successfully!`);
    setFormData({
      projectId: projects[0]?.id || '',
      title: '',
      stageKey: ARCHITECTURAL_STAGES[2],
      description: '',
      assignedMember: 'Principal Architect',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'HIGH',
    });
  };

  const handleUpdateStatus = (id: string, status: DeliverableStatus, progressPercent: number) => {
    const target = deliverables.find((d) => d.id === id);
    if (!target) return;
    const updated: ArchitectDeliverable = {
      ...target,
      status,
      progressPercent,
      completedAt: status === 'COMPLETED' ? new Date().toISOString() : target.completedAt,
      updatedAt: new Date().toISOString(),
    };
    saveArchitectDeliverable(updated);
    reloadDeliverables();
    success(`Deliverable updated to ${status} (${progressPercent}%)!`);
  };

  const filteredDeliverables = useMemo(() => {
    if (activeTab === 'pending') {
      return deliverables.filter((d) => d.status === 'PENDING_REVIEW' || d.status === 'IN_PROGRESS');
    }
    return deliverables;
  }, [deliverables, activeTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 10)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <Layers className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  10. Milestone & Deliverable Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  {deliverables.length} Deliverables
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Stage-wise architectural milestones, drawing release tracking, revision history, and customer sign-offs for escrow payouts.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add Action */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deliverable</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 10 SUB-NAVIGATION TABS (10.1 to 10.3)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'milestones'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>10.1 10-Stage Milestone Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('deliverables')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'deliverables'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>10.2 Architectural Deliverables Registry ({deliverables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>10.3 Pending Customer Sign-offs</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: 10-STAGE MILESTONE ROADMAP
      ========================================================================= */}
      {activeTab === 'milestones' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy-950">
              10-Stage Architectural Lifecycle & Escrow Disbursement Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each milestone represents an autonomous architectural work unit with linked customer sign-offs and escrow payout release triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARCHITECTURAL_STAGES.map((stgName, idx) => {
              const matchedDelivs = deliverables.filter((d) => d.stageKey === stgName);
              const isDone = matchedDelivs.some((d) => d.status === 'COMPLETED');
              const isInProgress = matchedDelivs.some((d) => d.status === 'IN_PROGRESS');

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs space-y-2 transition ${
                    isDone
                      ? 'bg-blue-50/70 border-blue-200'
                      : isInProgress
                      ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-300'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-slate-900">Stage {idx + 1}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isDone
                        ? 'bg-blue-100 text-blue-900'
                        : isInProgress
                        ? 'bg-sky-100 text-sky-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isDone ? 'COMPLETED' : isInProgress ? 'IN PROGRESS' : 'QUEUED'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{stgName.split('. ')[1] || stgName}</h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span>Deliverables: <strong>{matchedDelivs.length} Active</strong></span>
                    <span className="text-blue-900 font-bold">
                      {isDone ? 'Sign-off Received' : isInProgress ? 'Drafting in progress' : 'Awaiting start'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2 & 3: DELIVERABLES REGISTRY / PENDING APPROVALS
      ========================================================================= */}
      {(activeTab === 'deliverables' || activeTab === 'pending') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDeliverables.map((d) => {
              const isCompleted = d.status === 'COMPLETED';
              return (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-400">{d.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isCompleted ? 'bg-blue-100 text-blue-900' : 'bg-sky-100 text-sky-900'
                      }`}>
                        {d.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-navy-950">{d.title}</h3>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{d.stageKey}</div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {d.description}
                    </p>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-500">
                        <span>Completion Progress</span>
                        <span className="font-bold text-blue-900">{d.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${d.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>Lead: <strong>{d.assignedMember}</strong></span>
                      <span className="font-mono">Due: {formatDate(d.dueDate)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-3 flex items-center gap-2">
                    {!isCompleted && (
                      <button
                        onClick={() => handleUpdateStatus(d.id, 'COMPLETED', 100)}
                        className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign-off Complete</span>
                      </button>
                    )}
                    {isCompleted && (
                      <div className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-900" />
                        <span>Client Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD DELIVERABLE MODAL
      ========================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-950">Add Architectural Deliverable</h3>
                <p className="text-xs text-slate-500">
                  Assign milestone deliverables to team members and sync with client schedule
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateDeliverable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || (p as any).title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliverable Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3D Elevation Facade Render - North Aspect"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Architectural Lifecycle Stage</label>
                <select
                  value={formData.stageKey}
                  onChange={(e) => setFormData({ ...formData, stageKey: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                >
                  {ARCHITECTURAL_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Lead</label>
                  <select
                    value={formData.assignedMember}
                    onChange={(e) => setFormData({ ...formData, assignedMember: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="Principal Architect">Principal Architect</option>
                    <option value="Lead Architect">Lead Architect</option>
                    <option value="3D Visualizer">3D Visualizer</option>
                    <option value="Structural Consultant">Structural Consultant</option>
                    <option value="MEP Consultant">MEP Consultant</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliverable Scope & Specs</label>
                <textarea
                  rows={2}
                  placeholder="Detail drawing scale, software formats, and deliverable items..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Create Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
