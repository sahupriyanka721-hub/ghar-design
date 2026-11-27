import React, { useState, useEffect } from 'react';
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
  MapPin,
  Building2,
  FileText,
  User,
  Phone,
  Paperclip,
  Check,
  AlertTriangle,
  RotateCcw,
  Palette,
  Eye,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getInteriorProjects,
  saveInteriorProject,
  InteriorProject,
  InteriorProjectStatus,
  InteriorProjectStage,
  getInteriorDesignerByPhone,
  SEED_INTERIOR_DESIGNERS,
} from '../../data/interiorDesignerStore.js';
import { formatINR } from '../../lib/utils.js';
import { syncChannel } from '../../data/customerStore.js';

export const InteriorDesignerProjects: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState<InteriorProject[]>(() => getInteriorProjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXECUTION' | 'DESIGN' | 'KICKOFF' | 'REVIEW' | 'COMPLETED'>('ALL');
  const [selectedProject, setSelectedProject] = useState<InteriorProject | null>(null);
  const [modalTab, setModalTab] = useState<'OVERVIEW' | 'BRIEF' | 'MILESTONES' | 'PLAN' | 'DOCS'>('OVERVIEW');

  const loadData = () => {
    setProjects(getInteriorProjects());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('interior_projects_updated', loadData);

    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'INTERIOR_PROJECTS_UPDATED') {
        loadData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('interior_projects_updated', loadData);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matches =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matches) return false;
    if (filterTab === 'ALL') return true;
    if (filterTab === 'EXECUTION') return p.status === 'EXECUTION_IN_PROGRESS' || p.currentStage === 'SITE_EXECUTION';
    if (filterTab === 'DESIGN') return p.status === 'DESIGN_IN_PROGRESS' || p.currentStage === 'VISUALIZATION_3D';
    if (filterTab === 'KICKOFF') return p.status === 'PENDING_KICKOFF' || p.status === 'ASSIGNED';
    if (filterTab === 'REVIEW') return p.status === 'SUBMITTED_FOR_ADMIN_REVIEW' || p.status === 'CUSTOMER_REVIEW_PENDING';
    if (filterTab === 'COMPLETED') return p.status === 'COMPLETED';
    return true;
  });

  const totalContractSum = projects.reduce((acc, p) => acc + p.totalContractValue, 0);
  const totalPaidSum = projects.reduce((acc, p) => acc + p.paidAmount, 0);
  const activeCount = projects.filter((p) => p.status === 'EXECUTION_IN_PROGRESS' || p.status === 'DESIGN_IN_PROGRESS').length;

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black uppercase font-mono mb-1.5 border border-blue-200">
            <HardHat className="w-3.5 h-3.5 text-blue-600" />
            <span>Section 8 • Shared Project Management & Planning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Active Projects & Site Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Centralized shared projects synchronized across Customer, Interior Designer, and Admin panels with unique Project IDs (e.g., BG-2026-0002).
          </p>
        </div>

        <Link
          to="/interior-designer/designs"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-2 shadow-md self-start sm:self-auto"
        >
          <Box className="w-4 h-4" />
          <span>Open Design Studio</span>
        </Link>
      </div>

      {/* ---------------- SECTION 8 GOVERNANCE BANNER ---------------- */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Section 8 Governance Rule:</strong> Interior Designer cannot independently activate or close a project. Project kickoff, milestone releases, and closure strictly follow BuildGhar Admin-controlled workflow and contract conditions.
          </span>
        </div>
        <span className="font-mono font-bold bg-white text-amber-900 px-3 py-1 rounded-full border border-amber-200 shrink-0">
          Admin Controlled Workflow
        </span>
      </div>

      {/* ---------------- 4 SUMMARY METRICS CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Assigned Projects</span>
          <div className="text-2xl font-black text-navy-950 font-display">{projects.length}</div>
          <span className="text-[11px] text-blue-700 font-semibold mt-0.5 block">{activeCount} Ongoing Sites</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Contract Value</span>
          <div className="text-xl font-black text-navy-950 font-mono truncate">{formatINR(totalContractSum)}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Approved Scope Total</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Disbursed via Escrow</span>
          <div className="text-xl font-black text-emerald-700 font-mono truncate">{formatINR(totalPaidSum)}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Milestone Releases Completed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Escrow In Clearance</span>
          <div className="text-xl font-black text-amber-700 font-mono truncate">
            {formatINR(totalContractSum - totalPaidSum)}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">Secured in BuildGhar Vault</span>
        </div>
      </div>

      {/* ---------------- FILTERS & SEARCH ---------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Project ID (e.g. BG-2026-0002), Client, Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border-none text-navy-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { tab: 'ALL', label: 'All Projects', count: projects.length },
            { tab: 'EXECUTION', label: 'Site Execution', count: projects.filter((p) => p.status === 'EXECUTION_IN_PROGRESS').length },
            { tab: 'DESIGN', label: 'Design Stage', count: projects.filter((p) => p.status === 'DESIGN_IN_PROGRESS').length },
            { tab: 'KICKOFF', label: 'Pending Kickoff', count: projects.filter((p) => p.status === 'PENDING_KICKOFF').length },
            { tab: 'COMPLETED', label: 'Completed', count: projects.filter((p) => p.status === 'COMPLETED').length },
          ].map((t) => (
            <button
              key={t.tab}
              onClick={() => setFilterTab(t.tab as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === t.tab
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  filterTab === t.tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- PROJECT CARDS GRID ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between overflow-hidden"
          >
            <div className="p-5 space-y-3.5">
              {/* Top Meta */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-blue-700 text-xs bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {p.projectId}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    p.status === 'EXECUTION_IN_PROGRESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : p.status === 'DESIGN_IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : p.status === 'PENDING_KICKOFF'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {p.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Title & Location */}
              <div>
                <h3 className="font-extrabold text-navy-950 text-base">{p.title}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{p.location}</span>
                </div>
              </div>

              {/* Specs & Homeowner */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-bold text-navy-950">{p.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Property:</span>
                  <span className="font-medium text-slate-800">{p.propertyType} ({p.carpetAreaSqFt} sq.ft)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contract Value:</span>
                  <span className="font-mono font-bold text-navy-950">{formatINR(p.totalContractValue)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Verified Milestone Progress</span>
                  <span className="font-mono text-blue-700">{p.overallProgressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${p.overallProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 font-semibold">
                Target: {p.targetEndDate}
              </span>
              <button
                onClick={() => {
                  setSelectedProject(p);
                  setModalTab('OVERVIEW');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
              >
                <span>Inspect Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8 & 9 MODAL: COMPLETE SHARED PROJECT DOSSIER & PLANNING           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5"
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-700 text-sm bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      Shared Project ID: {selectedProject.projectId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedProject.status === 'EXECUTION_IN_PROGRESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedProject.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-navy-950 mt-1">{selectedProject.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dossier Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
                {[
                  { tab: 'OVERVIEW', label: 'Project Scope & Team' },
                  { tab: 'BRIEF', label: 'Approved Design Brief (9A)' },
                  { tab: 'MILESTONES', label: 'Milestone Releases' },
                  { tab: 'PLAN', label: '8-Phase Roadmap' },
                  { tab: 'DOCS', label: 'Contracts & Permits' },
                ].map((t) => (
                  <button
                    key={t.tab}
                    onClick={() => setModalTab(t.tab as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      modalTab === t.tab
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW & TEAM */}
              {modalTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Client Reference</span>
                      <span className="font-bold text-navy-950">{selectedProject.customerName}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Property Type</span>
                      <span className="font-bold text-navy-950">{selectedProject.propertyType}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Contract Value</span>
                      <span className="font-mono font-bold text-navy-950">
                        {formatINR(selectedProject.totalContractValue)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Handover</span>
                      <span className="font-bold text-navy-950">{selectedProject.targetEndDate}</span>
                    </div>
                  </div>

                  {/* Site Address */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="text-slate-400 uppercase font-bold text-[10px] block mb-0.5">Project Site Address</span>
                    <span className="font-bold text-navy-950">{selectedProject.projectAddress}</span>
                  </div>

                  {/* Approved Scope */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-navy-950 block">Approved Commercial Scope (Accepted Quotation):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProject.approvedScope.map((scope, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[11px]"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Multi-Party Team */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2 text-xs">
                    <span className="font-black text-navy-950 block uppercase tracking-wider text-[11px]">
                      BuildGhar Multi-Party Project Council
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Assigned Architect</span>
                        <span className="font-bold text-navy-950">{selectedProject.assignedArchitect || 'Ar. Pooja Mehra'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Execution Contractor</span>
                        <span className="font-bold text-navy-950">{selectedProject.assignedContractor || 'Apex Civil & Woodcraft'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                        <span className="text-[10px] text-slate-400 block font-bold">PMC Site Supervisor</span>
                        <span className="font-bold text-navy-950">{selectedProject.assignedSiteSupervisor || 'Er. Sandeep Yadav'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DESIGN BRIEF (SECTION 9A) */}
              {modalTab === 'BRIEF' && (
                <div className="space-y-4">
                  {selectedProject.designBrief ? (
                    <>
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Admin-Approved Brief:</strong> Interior Designer must work strictly from this approved design brief. New requirements must be routed through Admin as official change requests.
                          </span>
                        </div>
                        <span className="font-mono font-bold bg-white text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          Approved {selectedProject.designBrief.approvedAt.slice(0, 10)}
                        </span>
                      </div>

                      {/* Brief Specs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved Design Style</span>
                          <span className="font-bold text-navy-950 text-sm block">{selectedProject.designBrief.designStyle}</span>
                          <span className="text-slate-600 block mt-1">{selectedProject.designBrief.customerRequirements}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Preferences</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedProject.designBrief.materialPreferences.map((mat, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                                {mat}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Color Palette Preferences</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedProject.designBrief.colorPreferences.map((col, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Lighting Requirements</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedProject.designBrief.lightingRequirements.map((light, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                                {light}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Room Breakdown Table */}
                      <div className="space-y-2">
                        <h4 className="font-black text-navy-950 text-xs uppercase tracking-wider">Room-by-Room Requirements</h4>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                                <th className="py-2.5 px-3">Room Name</th>
                                <th className="py-2.5 px-3">Dimensions</th>
                                <th className="py-2.5 px-3">Style / Palette</th>
                                <th className="py-2.5 px-3">Specific Requirements</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedProject.designBrief.roomBreakdown.map((rb, i) => (
                                <tr key={i}>
                                  <td className="py-2.5 px-3 font-bold text-navy-950">{rb.roomName}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-600">{rb.dimensions}</td>
                                  <td className="py-2.5 px-3 text-slate-700">{rb.style} • {rb.colorScheme}</td>
                                  <td className="py-2.5 px-3 text-slate-600">{rb.requirements}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No design brief uploaded yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MILESTONES & PAYOUTS */}
              {modalTab === 'MILESTONES' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-navy-950">Verified Contract Milestones</span>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      Total: {formatINR(selectedProject.totalContractValue)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedProject.milestones.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy-950">{m.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                m.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {m.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Target Due Date: {m.dueDate} • Weight: {m.weightPercent}%
                          </span>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="font-mono font-black text-navy-950 text-sm block">
                            {formatINR(m.payoutAmount)}
                          </span>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                              m.escrowStatus === 'RELEASED_TO_DESIGNER'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {m.escrowStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: 8-PHASE ROADMAP */}
              {modalTab === 'PLAN' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex items-center justify-between">
                    <span>
                      <strong>Standard 8-Phase Architectural Roadmap:</strong> Progress across design, fabrication, and site handover.
                    </span>
                    <span className="font-mono font-bold">{selectedProject.overallProgressPercent}% Complete</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { num: 1, title: 'Phase 1: Site Measurement & Architectural Demarcation', status: 'COMPLETED', lead: 'Site Supervisor' },
                      { num: 2, title: 'Phase 2: Space Planning & 2D Working CAD Layouts', status: 'COMPLETED', lead: 'Interior Designer' },
                      { num: 3, title: 'Phase 3: 3D Visualization Renders & Moodboard Sign-Off', status: selectedProject.overallProgressPercent >= 35 ? 'COMPLETED' : 'IN_PROGRESS', lead: 'Interior Designer' },
                      { num: 4, title: 'Phase 4: Material Swatches & Dynamic BOQ Finalization', status: selectedProject.overallProgressPercent >= 45 ? 'COMPLETED' : 'IN_PROGRESS', lead: 'Interior Designer & Vendor' },
                      { num: 5, title: 'Phase 5: Civil Demolition, Electrical & Ceiling Framing', status: selectedProject.overallProgressPercent >= 45 ? 'IN_PROGRESS' : 'PENDING', lead: 'Contractor & PMC' },
                      { num: 6, title: 'Phase 6: Modular Carcass Fabrication & Assembly', status: 'PENDING', lead: 'Woodcraft Contractor' },
                      { num: 7, title: 'Phase 7: Finishes, Painting, Wallpaper & Lighting Installation', status: 'PENDING', lead: 'Finishing Contractors' },
                      { num: 8, title: 'Phase 8: Snag Rectification, Deep Cleaning & Handover', status: 'PENDING', lead: 'PMC & Homeowner' },
                    ].map((step) => (
                      <div
                        key={step.num}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              step.status === 'COMPLETED'
                                ? 'bg-emerald-600 text-white'
                                : step.status === 'IN_PROGRESS'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {step.status === 'COMPLETED' ? <Check className="w-3.5 h-3.5" /> : step.num}
                          </div>
                          <span className="font-bold text-navy-950">{step.title}</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              step.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : step.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {step.status}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Lead: {step.lead}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: OFFICIAL CONTRACTS & DOCUMENTS */}
              {modalTab === 'DOCS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-navy-950">Official Project Documents</span>
                    <span className="text-xs text-slate-400">Vault Verified</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {selectedProject.documents && selectedProject.documents.length > 0 ? (
                      selectedProject.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div>
                              <span className="font-bold text-navy-950 block">{doc.name}</span>
                              <span className="text-[10px] text-slate-400">Uploaded on {doc.uploadedAt} • {doc.type}</span>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-blue-700 font-bold text-xs"
                          >
                            Download
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs">No documents available.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Close
                </button>
                <Link
                  to={`/interior-designer/designs?projectId=${selectedProject.id}`}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Box className="w-4 h-4" />
                  <span>Open in Design Studio</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
