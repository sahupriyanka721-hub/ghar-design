import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getExecutionProjects,
  saveExecutionProject,
  calculateProjectWeightedProgress,
  ExecutionProject,
} from '../../data/projectExecutionStore.js';
import {
  Layers,
  Building,
  CheckCircle2,
  Clock,
  HardHat,
  Camera,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Compass,
  PlusCircle,
  X,
  Upload,
} from 'lucide-react';

export const ProfessionalProjects: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [projects, setProjects] = useState<ExecutionProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ExecutionProject | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MILESTONES' | 'PROGRESS_UPDATE' | 'SITE_REPORT'>('OVERVIEW');

  // Progress update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [newProgressPercent, setNewProgressPercent] = useState<number>(50);
  const [updateNotes, setUpdateNotes] = useState('');
  const [issuesEncountered, setIssuesEncountered] = useState('');
  const [nextActivity, setNextActivity] = useState('');

  const loadProjects = () => {
    const list = getExecutionProjects();
    setProjects(list);
    if (list.length > 0 && !selectedProject) {
      setSelectedProject(list[0]);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenUpdate = (proj: ExecutionProject, stageIdx: number) => {
    setSelectedProject(proj);
    setSelectedStageIndex(stageIdx);
    const stage = proj.stages[stageIdx];
    setNewProgressPercent(stage ? stage.progressPercent : 0);
    setUpdateNotes('');
    setIssuesEncountered('');
    setNextActivity('');
    setShowUpdateModal(true);
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (newProgressPercent < 0 || newProgressPercent > 100) {
      error('Progress percentage must be between 0% and 100%');
      return;
    }

    const currentStage = selectedProject.stages[selectedStageIndex];
    if (!currentStage) return;

    const updatedStages = (selectedProject.stages || []).map((stg, idx) => {
      if (idx === selectedStageIndex) {
        return {
          ...stg,
          progressPercent: newProgressPercent,
          status: (newProgressPercent === 100 ? 'COMPLETED' : 'IN_PROGRESS') as any,
        };
      }
      return stg;
    });

    const newWeighted = calculateProjectWeightedProgress(updatedStages);

    const newReports = [...selectedProject.dailyReports];
    if (updateNotes) {
      newReports.unshift({
        id: `rep-${Date.now()}`,
        date: new Date().toISOString(),
        reportedBy: user?.name || 'Professional In-Charge',
        role: 'PROFESSIONAL',
        workSummary: `Milestone [${currentStage.name}]: ${updateNotes}`,
        weather: 'CLEAR',
        activeWorkersCount: 12,
        notes: issuesEncountered ? `Issues: ${issuesEncountered} | Next: ${nextActivity}` : `Next: ${nextActivity}`,
      });
    }

    const updatedProject: ExecutionProject = {
      ...selectedProject,
      stages: updatedStages,
      weightedProgressPercent: newWeighted,
      dailyReports: newReports,
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(updatedProject);
    setSelectedProject(updatedProject);
    success(`Progress updated to ${newProgressPercent}% for stage "${currentStage.name}"!`);
    setShowUpdateModal(false);
    loadProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">Professional Project Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
              {projects.length} Active Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scope-aware milestone monitoring, IS 456 structural compliance, drawing signoffs, and site visit logs.
          </p>
        </div>

        <Link
          to="/professional/timeline"
          className="text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 self-start"
        >
          <HardHat className="w-4 h-4 text-sky-600" />
          <span>Site Timeline View</span>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-3">
          <Building className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Projects Under Execution Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Once a client accepts and confirms your quotation, the active architectural design and construction workspace will initialize here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Left Sidebar / Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Engagements ({projects.length})
            </h3>
            {projects.map((p) => {
              const isSelected = selectedProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`p-4 rounded-2xl border cursor-pointer transition text-xs space-y-2 ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-500 shadow-xs ring-1 ring-sky-400'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 text-xs">{(p as any).projectCode || p.requestCode || p.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                      {p.status}
                    </span>
                  </div>

                  <div className="font-bold text-slate-800 truncate">{(p as any).title || p.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{(p as any).location?.locality || p.propertyAddress || p.city || 'Site'}, {(p as any).location?.city || p.city || ''}</span>
                  </div>

                  {/* Progress Mini Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">IS 456 Progress</span>
                      <span className="font-bold text-sky-800">{Math.round((p as any).weightedProgressPercent ?? p.overallVerifiedProgress ?? p.overallReportedProgress ?? 0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round((p as any).weightedProgressPercent ?? p.overallVerifiedProgress ?? p.overallReportedProgress ?? 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Project Details Workspace (Right 2 Cols) */}
          <div className="lg:col-span-2 space-y-5">
            {selectedProject && (
              <div className="bg-white rounded-2xl border border-sky-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        {(selectedProject as any).projectCode || selectedProject.requestCode || selectedProject.id}
                      </span>
                      <h2 className="text-lg font-bold text-navy-950">{(selectedProject as any).title || selectedProject.name}</h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Client: <strong>{selectedProject.customerName}</strong> ({selectedProject.customerPhone})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Contract Value</span>
                    <span className="text-lg font-black text-blue-900 font-mono">
                      {formatINR((selectedProject as any).totalContractPaise || selectedProject.contractValuePaise || 0)}
                    </span>
                  </div>
                </div>

                {/* Scope-Aware Badges & Timeline */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Category</span>
                    <span className="font-bold text-slate-800">{selectedProject.category}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Plot Specs</span>
                    <span className="font-bold text-slate-800">{(selectedProject as any).plotAreaSqFt || 1200} sq.ft</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Start Date</span>
                    <span className="font-bold text-slate-800">{formatDate((selectedProject as any).startDate || selectedProject.plannedStartDate)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Est. Completion</span>
                    <span className="font-bold text-slate-800">{formatDate((selectedProject as any).targetCompletionDate || selectedProject.plannedEndDate)}</span>
                  </div>
                </div>

                {/* Sub-tabs within project */}
                <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`pb-2.5 border-b-2 transition ${
                      activeTab === 'OVERVIEW'
                        ? 'border-sky-600 text-sky-800'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Milestones & Scope ({(selectedProject.stages?.length || 0)})
                  </button>
                  <button
                    onClick={() => setActiveTab('SITE_REPORT')}
                    className={`pb-2.5 border-b-2 transition ${
                      activeTab === 'SITE_REPORT'
                        ? 'border-sky-600 text-sky-800'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Daily Site Logs ({(selectedProject.dailyReports?.length || 0)})
                  </button>
                </div>

                {/* Milestones List */}
                {activeTab === 'OVERVIEW' && (
                  <div className="space-y-3">
                    {(selectedProject.stages || []).map((stg, idx) => (
                      <div
                        key={stg.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black flex items-center justify-center text-[11px]">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">{stg.name}</div>
                              <div className="text-[11px] text-slate-500">IS 456 Weight: {stg.weightPercent}%</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                stg.status === 'COMPLETED'
                                  ? 'bg-blue-100 text-blue-900'
                                  : stg.status === 'IN_PROGRESS'
                                  ? 'bg-sky-100 text-sky-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {stg.status}
                            </span>
                            <button
                              onClick={() => handleOpenUpdate(selectedProject, idx)}
                              className="px-3 py-1 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>Update %</span>
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-slate-500">
                            <span>Stage Completion</span>
                            <span className="font-bold text-slate-800">{(stg as any).progressPercent ?? stg.verifiedProgress ?? stg.reportedProgress ?? 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${(stg as any).progressPercent ?? stg.verifiedProgress ?? stg.reportedProgress ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Site Reports List */}
                {activeTab === 'SITE_REPORT' && (
                  <div className="space-y-3">
                    {(selectedProject.dailyReports?.length || 0) === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No site visit reports logged yet. Submit a progress update to log site observations.
                      </div>
                    ) : (
                      (selectedProject.dailyReports || []).map((r) => (
                        <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{r.reportedBy} ({r.role})</span>
                            <span className="text-[10px] font-mono text-slate-400">{formatDate((r as any).date || r.reportDate || r.submittedAt)}</span>
                          </div>
                          <p className="text-slate-600">{r.workSummary}</p>
                          {r.notes && <p className="text-[11px] text-slate-500 italic">{r.notes}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {showUpdateModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Update Progress: {selectedProject.stages[selectedStageIndex]?.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">{(selectedProject as any).projectCode || selectedProject.requestCode || selectedProject.id}</p>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-bold">Progress Percentage (0 - 100%)</label>
                  <span className="font-mono font-black text-sky-800 text-sm">{newProgressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newProgressPercent}
                  onChange={(e) => setNewProgressPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Work Description / Observations</label>
                <textarea
                  rows={2}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Issues or Delays (Optional)</label>
                <input
                  type="text"
                  value={issuesEncountered}
                  onChange={(e) => setIssuesEncountered(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Next Planned Activity</label>
                <input
                  type="text"
                  value={nextActivity}
                  onChange={(e) => setNextActivity(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 leading-relaxed">
                Progress updates are transmitted to the Customer Panel and reflected in the IS 456 weighted progress engine.
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
