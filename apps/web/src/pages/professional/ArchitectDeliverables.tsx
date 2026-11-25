import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  getArchitectDeliverables,
  saveArchitectDeliverable,
  ArchitectDeliverable,
  DeliverableStatus,
  DeliverablePriority,
} from '../../data/architectPanelStore.js';

const ARCHITECTURAL_STAGES = [
  '1. Initial Consultation',
  '2. Site Measurement & Analysis',
  '3. Concept Floor Planning',
  '4. Preliminary Floor Plan Revision',
  '5. Final Floor Plan Sign-off',
  '6. 2D Architectural & Section Drawings',
  '7. 3D Exterior Elevation & Walkthrough',
  '8. Structural Coordination Drawings',
  '9. Architectural Working Drawings',
  '10. Final Municipal & Contractor Documentation',
];

export const ArchitectDeliverables: React.FC = () => {
  const [deliverables, setDeliverables] = useState<ArchitectDeliverable[]>(() =>
    getArchitectDeliverables()
  );
  const [projects] = useState(() => getExecutionProjects());
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
      projectTitle: selProj?.title || 'Residential Architectural Project',
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider font-mono">
                Section 10 & 15 Deliverables
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                10 Architectural Milestones
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Architectural Milestone & Deliverables Desk
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl mt-1 leading-relaxed">
              Track stage-wise architectural milestones separate from contractor construction. Upload drawing evidence, track revision cycles, and request client sign-offs for escrow disbursements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white text-navy-950 font-black text-xs hover:bg-slate-50 transition shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Create New Deliverable</span>
            </button>
          </div>
        </div>
      </div>

      {/* DELIVERABLES LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80">
          <div>
            <h2 className="text-sm font-black text-navy-950">Architectural Milestones ({deliverables.length})</h2>
            <p className="text-xs text-slate-500">Scheduled deliverable deadlines and homeowner sign-off status</p>
          </div>
        </div>

        {deliverables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deliverables.map((item) => {
              const isCompleted = item.status === 'COMPLETED';
              const isSubmitted = item.status === 'SUBMITTED_FOR_REVIEW';
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700">
                        {item.stageKey}
                      </span>
                      <Badge
                        variant={isCompleted ? 'success' : isSubmitted ? 'info' : 'warning'}
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-navy-950">{item.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Project:</span>
                        <span className="font-semibold text-slate-800">{item.projectTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span className="font-semibold text-rose-600">{item.dueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lead:</span>
                        <span className="font-semibold text-slate-700">{item.assignedMember}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>Completion Progress</span>
                        <span>{item.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-3 flex items-center gap-2">
                    {item.status !== 'COMPLETED' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'SUBMITTED_FOR_REVIEW', 90)}
                          className="flex-1 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition text-center"
                        >
                          Submit for Review
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'COMPLETED', 100)}
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Milestone Delivered & Approved</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <ListTodo className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">No Deliverables Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Plan out the architectural milestone delivery phases to keep homeowners updated and unlock escrow releases.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Initial Architectural Deliverable</span>
            </button>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-950">Create Architecture Deliverable (15.0)</h3>
                <p className="text-xs text-slate-500">Stage-wise milestone for client sign-off</p>
              </div>
            </div>

            <form onSubmit={handleCreateDeliverable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.code} ({p.customerName})
                    </option>
                  ))}
                  {projects.length === 0 && <option value="DEFAULT">General Project</option>}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Architectural Stage (15.0)</label>
                <select
                  value={formData.stageKey}
                  onChange={(e) => setFormData({ ...formData, stageKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                >
                  {ARCHITECTURAL_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliverable Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preliminary Vastu Compliant Floor Plan Draft"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scope & Inclusions</label>
                <textarea
                  rows={2}
                  placeholder="Specify what technical drawings or documents are included..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md transition"
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
