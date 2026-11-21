import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardHat,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  Box,
  Camera,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  FileCheck2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  getInteriorProjects,
  saveInteriorProject,
  InteriorProject,
  InteriorProjectStage,
  getInteriorDesignerByPhone,
} from '../../data/interiorDesignerStore.js';

export const InteriorDesignerProjects: React.FC = () => {
  const { user } = useAuth();
  const designer = user?.phone ? getInteriorDesignerByPhone(user.phone) : null;
  const [projects, setProjects] = useState<InteriorProject[]>(() =>
    getInteriorProjects(designer?.id || 'id-101')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXECUTION' | 'DESIGN' | 'COMPLETED'>('ALL');
  const [selectedProject, setSelectedProject] = useState<InteriorProject | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStage, setNewStage] = useState<InteriorProjectStage>('SITE_EXECUTION');
  const [progressNotes, setProgressNotes] = useState('');

  const filteredProjects = projects.filter((p) => {
    const matches =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matches) return false;
    if (filterTab === 'ALL') return true;
    if (filterTab === 'EXECUTION') return p.currentStage === 'SITE_EXECUTION' || p.currentStage === 'QUALITY_INSPECTION';
    if (filterTab === 'DESIGN') return p.currentStage === 'CONCEPT_DESIGN' || p.currentStage === 'LAYOUT_2D' || p.currentStage === 'VISUALIZATION_3D';
    if (filterTab === 'COMPLETED') return p.currentStage === 'HANDOVER' || p.currentStage === 'COMPLETED';
    return true;
  });

  const handleUpdateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    // Calculate updated progress
    let newProgress = selectedProject.overallProgressPercent;
    if (newStage === 'COMPLETED' || newStage === 'HANDOVER') newProgress = 100;
    else if (newStage === 'QUALITY_INSPECTION' || newStage === 'SNAG_RECTIFICATION') newProgress = 85;
    else if (newStage === 'SITE_EXECUTION') newProgress = 65;
    else if (newStage === 'MATERIAL_PROCUREMENT' || newStage === 'BOQ_FINALIZATION') newProgress = 45;
    else if (newStage === 'DESIGN_APPROVAL') newProgress = 35;
    else if (newStage === 'VISUALIZATION_3D') newProgress = 25;

    const updated = saveInteriorProject({
      id: selectedProject.id,
      currentStage: newStage,
      overallProgressPercent: newProgress,
      notes: progressNotes ? `${selectedProject.notes || ''} | ${progressNotes}` : selectedProject.notes,
    });

    setProjects(getInteriorProjects(designer?.id || 'id-101'));
    setSelectedProject(updated);
    setIsUpdateModalOpen(false);
    setProgressNotes('');
  };

  const handleToggleMilestone = (project: InteriorProject, milestoneId: string) => {
    const updatedMilestones = (project.milestones || []).map((m) => {
      if (m.id === milestoneId) {
        const nextStatus = m.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
        const nextEscrow = nextStatus === 'COMPLETED' ? 'RELEASED_TO_DESIGNER' : 'LOCKED_IN_ESCROW';
        return { ...m, status: nextStatus, escrowStatus: nextEscrow as any };
      }
      return m;
    });

    // recalculate overall progress percent from weighted milestones
    const completedWeight = updatedMilestones
      .filter((m) => m.status === 'COMPLETED')
      .reduce((sum, m) => sum + m.weightPercent, 0);

    const updated = saveInteriorProject({
      id: project.id,
      milestones: updatedMilestones,
      overallProgressPercent: completedWeight,
    });

    setProjects(getInteriorProjects(designer?.id || 'id-101'));
    if (selectedProject?.id === project.id) {
      setSelectedProject(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <HardHat className="w-3.5 h-3.5 text-blue-600" />
            <span>Interior Project Execution Lifecycle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Project Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track 13-stage interior progress, weighted milestones, escrow releases, and site handovers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/interior-designer/designs"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Box className="w-4 h-4 text-blue-600" />
            <span>3D Design Center</span>
          </Link>
          <Link
            to="/interior-designer/boq"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-4 h-4" />
            <span>BOQ & Estimates</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Active Projects</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{projects.length}</div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Live Project Sites</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">In Site Execution</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {projects.filter((p) => p.currentStage === 'SITE_EXECUTION').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Carpentry & False Ceiling</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Total Order Value</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{(projects.reduce((acc, p) => acc + p.totalContractValue, 0) / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">Escrow Backed Contracts</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Released to Designer</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            ₹{(projects.reduce((acc, p) => acc + p.paidAmount, 0) / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Milestones Verified</div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All Projects' },
            { id: 'EXECUTION', label: 'In Execution' },
            { id: 'DESIGN', label: 'Design & 3D' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search project title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Projects List with Expandable Milestones */}
      <div className="space-y-4">
        {filteredProjects.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-200 transition"
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-mono text-xs font-bold">
                    {p.projectId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                    {p.propertyType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
                    Stage: {p.currentStage.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 mt-2">{p.title}</h3>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Client: <strong className="text-slate-800">{p.customerName}</strong> (+91 {p.customerPhone})</span>
                  <span>•</span>
                  <span>{p.location}</span>
                </div>
              </div>

              {/* Progress Bar & Contract Value */}
              <div className="lg:w-80 shrink-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-600">Weighted Progress</span>
                  <span className="font-mono font-black text-blue-600 text-sm">
                    {p.overallProgressPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${p.overallProgressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>Total: <strong>₹{p.totalContractValue.toLocaleString('en-IN')}</strong></span>
                  <span className="text-emerald-700 font-bold">
                    Paid: ₹{p.paidAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Milestones Breakdown */}
            <div className="mt-4 pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
                  Milestone Escrow Schedule ({p.milestones.length} Stages)
                </span>
                <span className="text-[11px] text-slate-500">
                  Click checkbox to update milestone progress
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(p.milestones || []).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMilestone(p, m.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                      m.status === 'COMPLETED'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="pt-0.5">
                      {m.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : m.status === 'IN_PROGRESS' ? (
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
                      )}
                    </div>

                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900 leading-tight">
                        {m.name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Weight: {m.weightPercent}%</span>
                        <span className="font-mono font-bold text-slate-700">
                          ₹{m.payoutAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            m.escrowStatus === 'RELEASED_TO_DESIGNER'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m.escrowStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedProject(p);
                    setNewStage(p.currentStage);
                    setIsUpdateModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-50 text-blue-800 font-bold transition flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Update Stage</span>
                </button>

                <Link
                  to="/interior-designer/designs"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition flex items-center gap-1.5"
                >
                  <Box className="w-3.5 h-3.5 text-slate-500" />
                  <span>Design Approvals</span>
                </Link>

                <Link
                  to="/interior-designer/site-management"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>Site Visits & Snags</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Handover: <strong>{p.targetEndDate}</strong></span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stage Update Modal */}
      <AnimatePresence>
        {isUpdateModalOpen && selectedProject && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <span>Update Project Stage</span>
                </div>
                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStage} className="space-y-4 mt-4 text-xs">
                <div>
                  <div className="text-slate-500 font-semibold mb-1">Project</div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800">
                    {selectedProject.title} ({selectedProject.projectId})
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Select New Lifecycle Stage *
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as InteriorProjectStage)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-semibold"
                  >
                    <option value="INITIAL_CONSULTATION">1. Initial Consultation</option>
                    <option value="SITE_MEASUREMENT">2. Site Measurement</option>
                    <option value="CONCEPT_DESIGN">3. Concept Design</option>
                    <option value="LAYOUT_2D">4. 2D Layout Preparation</option>
                    <option value="VISUALIZATION_3D">5. 3D Visualization</option>
                    <option value="DESIGN_APPROVAL">6. Design Submitted for Customer Approval</option>
                    <option value="BOQ_FINALIZATION">7. BOQ and Cost Finalization</option>
                    <option value="MATERIAL_PROCUREMENT">8. Material Procurement</option>
                    <option value="SITE_EXECUTION">9. Execution & Installation</option>
                    <option value="QUALITY_INSPECTION">10. Quality Inspection</option>
                    <option value="SNAG_RECTIFICATION">11. Snag Rectification</option>
                    <option value="HANDOVER">12. Final Handover</option>
                    <option value="COMPLETED">13. Project Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Stage Progress & Site Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder=""
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Save Stage Update
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
