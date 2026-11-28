import React, { useState, useEffect, useMemo } from 'react';
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
  ListTodo,
  CalendarRange,
  Users2,
  Activity,
  PauseCircle,
  FolderCheck,
  ClipboardCheck,
  ArrowUpRight,
  Download,
  ExternalLink,
  MessageSquare,
  Play,
  Send,
  RefreshCw,
  Award,
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
} from '../../data/interiorDesignerStore.js';
import { formatINR } from '../../lib/utils.js';
import { syncChannel } from '../../data/customerStore.js';

export type ProjectViewMode =
  | 'MY_PROJECTS'
  | 'NEW_ASSIGNMENTS'
  | 'PROJECT_OVERVIEW'
  | 'PROJECT_KICKOFF'
  | 'PROJECT_PLANNING'
  | 'PROJECT_TIMELINE'
  | 'PROJECT_TASKS'
  | 'PROJECT_SCHEDULE'
  | 'PROJECT_COORDINATION'
  | 'PROJECT_STATUS'
  | 'COMPLETED_PROJECTS'
  | 'ON_HOLD_PROJECTS';

// Initial Kickoff Checklists state
interface KickoffChecklist {
  laserMeasurement: boolean;
  societyNoc: boolean;
  structuralCheck: boolean;
  servicesInspection: boolean;
  clientKickoffSignOff: boolean;
}

// Initial Tasks state per project
interface SiteTask {
  id: string;
  category: 'CIVIL' | 'ELECTRICAL' | 'CEILING' | 'WOODWORK' | 'COUNTERTOPS' | 'FINISHES' | 'SNAG';
  title: string;
  assignee: string;
  completed: boolean;
  dueDate: string;
}

export const InteriorDesignerProjects: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<InteriorProject[]>(() => getInteriorProjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXECUTION' | 'DESIGN' | 'KICKOFF' | 'REVIEW' | 'COMPLETED' | 'ON_HOLD'>('ALL');
  const [selectedProject, setSelectedProject] = useState<InteriorProject | null>(null);
  const [modalTab, setModalTab] = useState<'OVERVIEW' | 'BRIEF' | 'MILESTONES' | 'PLAN' | 'DOCS'>('OVERVIEW');

  // Active project selection for focused views (Kickoff, Planning, Timeline, Tasks, Schedule, Coordination)
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  // Kickoff checklist state
  const [kickoffStates, setKickoffStates] = useState<Record<string, KickoffChecklist>>({
    'prj-int-1': { laserMeasurement: true, societyNoc: true, structuralCheck: true, servicesInspection: true, clientKickoffSignOff: true },
    'prj-int-2': { laserMeasurement: true, societyNoc: true, structuralCheck: true, servicesInspection: true, clientKickoffSignOff: true },
    'prj-int-3': { laserMeasurement: true, societyNoc: false, structuralCheck: true, servicesInspection: false, clientKickoffSignOff: false },
    'prj-int-4': { laserMeasurement: true, societyNoc: true, structuralCheck: true, servicesInspection: true, clientKickoffSignOff: true },
    'prj-int-5': { laserMeasurement: true, societyNoc: false, structuralCheck: true, servicesInspection: true, clientKickoffSignOff: false },
  });

  // Site Tasks state
  const [projectTasks, setProjectTasks] = useState<Record<string, SiteTask[]>>({
    'prj-int-1': [
      { id: 't-101', category: 'CIVIL', title: 'Living room partition demolition & debris clearance', assignee: 'Apex Civil Team', completed: true, dueDate: '2026-11-05' },
      { id: 't-102', category: 'ELECTRICAL', title: 'Magnetic track conduit chasing & DB breaker upgrade', assignee: 'Er. Sandeep Yadav', completed: true, dueDate: '2026-11-12' },
      { id: 't-103', category: 'CEILING', title: 'Perimeter GI framework & Saint-Gobain Gyproc board fixing', assignee: 'Apex Woodcraft Team', completed: true, dueDate: '2026-11-20' },
      { id: 't-104', category: 'WOODWORK', title: 'Modular kitchen carcass alignment & Blum tandem drawer runners', assignee: 'Woodcraft Lead', completed: false, dueDate: '2026-12-05' },
      { id: 't-105', category: 'COUNTERTOPS', title: 'Statuario Italian marble dry lay & bookmatch client review', assignee: 'Ar. Pooja Mehra', completed: false, dueDate: '2026-12-12' },
      { id: 't-106', category: 'FINISHES', title: 'PU matte polish primer & Asian Paints Royale Aspira base coat', assignee: 'Finishing Lead', completed: false, dueDate: '2026-12-25' },
      { id: 't-107', category: 'SNAG', title: 'Full site laser snag audit & acoustic headboard fixing', assignee: 'BuildGhar PMC', completed: false, dueDate: '2027-01-15' },
    ],
    'prj-int-2': [
      { id: 't-201', category: 'CIVIL', title: 'Site laser measurement verification & door frame check', assignee: 'Ar. Pooja Mehra', completed: true, dueDate: '2026-11-10' },
      { id: 't-202', category: 'ELECTRICAL', title: 'Concealed lighting box layout as per 2D drawing', assignee: 'Apex Civil', completed: true, dueDate: '2026-11-18' },
      { id: 't-203', category: 'WOODWORK', title: 'Natural Oak veneer pressing for Scandinavian bedroom wardrobes', assignee: 'Woodcraft Lead', completed: false, dueDate: '2026-12-02' },
      { id: 't-204', category: 'COUNTERTOPS', title: 'Kalinga Stone Quartz templating for kitchen breakfast bar', assignee: 'Quartz Fabricator', completed: false, dueDate: '2026-12-08' },
      { id: 't-205', category: 'FINISHES', title: 'Low-VOC non-toxic PU clear coat application on oak slats', assignee: 'Finishing Lead', completed: false, dueDate: '2026-12-18' },
    ],
    'prj-int-3': [
      { id: 't-301', category: 'CIVIL', title: 'Laser measurement & As-Built CAD verification', assignee: 'Ar. Pooja Mehra', completed: true, dueDate: '2026-12-02' },
      { id: 't-302', category: 'CIVIL', title: 'Sushant Lok Society Gate Pass & RWA Demarcation NOC', assignee: 'BuildGhar Admin', completed: false, dueDate: '2026-12-05' },
      { id: 't-303', category: 'ELECTRICAL', title: 'Double-height grand chandelier ceiling anchor testing', assignee: 'Apex Civil', completed: false, dueDate: '2026-12-15' },
    ],
  });

  // Project coordination notes state
  const [coordinationNotes, setCoordinationNotes] = useState<Record<string, { id: string; author: string; role: string; text: string; time: string }[]>>({
    'prj-int-1': [
      { id: 'cn-1', author: 'Er. Sandeep Yadav', role: 'PMC Lead', text: 'False ceiling GI framing passed deflection test. Electrical track light rough-in approved.', time: 'Yesterday, 4:30 PM' },
      { id: 'cn-2', author: 'Ar. Pooja Mehra', role: 'Lead Interior Designer', text: 'Client requested bookmatch preview for Statuario marble table on Saturday 11 AM.', time: '2 days ago' },
    ],
    'prj-int-2': [
      { id: 'cn-3', author: 'Ar. Pooja Mehra', role: 'Lead Interior Designer', text: '3D renders for master bedroom approved by Meera Chawla with light ash wood tone.', time: '3 days ago' },
    ],
  });
  const [newNoteText, setNewNoteText] = useState('');

  const loadData = () => {
    const list = getInteriorProjects();
    setProjects(list);
    if (!activeProjectId && list.length > 0) {
      setActiveProjectId(list[0].id);
    }
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

  // Sync active project if none selected
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  // Current view from URL query param
  const currentView: ProjectViewMode = (searchParams.get('view') as ProjectViewMode) || 'MY_PROJECTS';

  const handleSetView = (view: ProjectViewMode) => {
    setSearchParams({ view });
  };

  // Filtered lists for distinct sub-views
  const newAssignments = useMemo(() => {
    return projects.filter((p) => p.status === 'ASSIGNED' || p.status === 'PENDING_KICKOFF');
  }, [projects]);

  const completedProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'COMPLETED');
  }, [projects]);

  const onHoldProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'ON_HOLD' || p.status === 'DELAYED');
  }, [projects]);

  const activeProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'EXECUTION_IN_PROGRESS' || p.status === 'DESIGN_IN_PROGRESS' || p.status === 'ACTIVE');
  }, [projects]);

  // Aggregate stats
  const totalContractSum = useMemo(() => projects.reduce((acc, p) => acc + p.totalContractValue, 0), [projects]);
  const totalPaidSum = useMemo(() => projects.reduce((acc, p) => acc + p.paidAmount, 0), [projects]);
  const pendingEscrowSum = totalContractSum - totalPaidSum;

  const totalTasksCount = useMemo(() => {
    return Object.values(projectTasks).reduce((acc, list) => acc + list.length, 0);
  }, [projectTasks]);

  // 12 Sub-features configuration tabs
  const PROJECT_VIEW_TABS: { id: ProjectViewMode; label: string; count: number; icon: any }[] = [
    { id: 'MY_PROJECTS', label: '1. My Projects', count: projects.length, icon: HardHat },
    { id: 'NEW_ASSIGNMENTS', label: '2. New Assignments', count: newAssignments.length, icon: Sparkles },
    { id: 'PROJECT_OVERVIEW', label: '3. Project Overview', count: projects.length, icon: TrendingUp },
    { id: 'PROJECT_KICKOFF', label: '4. Project Kickoff', count: newAssignments.length, icon: Play },
    { id: 'PROJECT_PLANNING', label: '5. Project Planning', count: projects.filter((p) => p.designBrief).length, icon: Layers },
    { id: 'PROJECT_TIMELINE', label: '6. Project Timeline', count: projects.length, icon: CalendarRange },
    { id: 'PROJECT_TASKS', label: '7. Project Tasks', count: totalTasksCount, icon: ListTodo },
    { id: 'PROJECT_SCHEDULE', label: '8. Project Schedule', count: projects.reduce((acc, p) => acc + p.milestones.length, 0), icon: Calendar },
    { id: 'PROJECT_COORDINATION', label: '9. Project Coordination', count: activeProjects.length, icon: Users2 },
    { id: 'PROJECT_STATUS', label: '10. Project Status', count: projects.length, icon: Activity },
    { id: 'COMPLETED_PROJECTS', label: '11. Completed Projects', count: completedProjects.length, icon: FolderCheck },
    { id: 'ON_HOLD_PROJECTS', label: '12. On-Hold Projects', count: onHoldProjects.length, icon: PauseCircle },
  ];

  // Active project for focused views
  const focusedProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // Filter projects for Master Grid (View 1)
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
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
      if (filterTab === 'ON_HOLD') return p.status === 'ON_HOLD' || p.status === 'DELAYED';
      return true;
    });
  }, [projects, searchQuery, filterTab]);

  // Toggle Kickoff Checklist item
  const handleToggleKickoff = (projId: string, itemKey: keyof KickoffChecklist) => {
    setKickoffStates((prev) => {
      const current = prev[projId] || {
        laserMeasurement: false,
        societyNoc: false,
        structuralCheck: false,
        servicesInspection: false,
        clientKickoffSignOff: false,
      };
      const updated = { ...current, [itemKey]: !current[itemKey] };
      info(`Kickoff item updated: ${itemKey} is now ${updated[itemKey] ? 'Verified' : 'Pending'}`);
      return { ...prev, [projId]: updated };
    });
  };

  // Toggle Site Task
  const handleToggleTask = (projId: string, taskId: string) => {
    setProjectTasks((prev) => {
      const list = prev[projId] || [];
      const updated = list.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      const target = list.find((t) => t.id === taskId);
      if (target) {
        success(`Task "${target.title}" marked ${!target.completed ? 'COMPLETED' : 'PENDING'}`);
      }
      return { ...prev, [projId]: updated };
    });
  };

  // Add Project Coordination Note
  const handleAddNote = () => {
    if (!newNoteText.trim() || !focusedProject) return;
    const newNote = {
      id: `cn-${Date.now()}`,
      author: user?.name || 'Ar. Pooja Mehra',
      role: 'Lead Interior Designer',
      text: newNoteText.trim(),
      time: 'Just now',
    };
    setCoordinationNotes((prev) => ({
      ...prev,
      [focusedProject.id]: [newNote, ...(prev[focusedProject.id] || [])],
    }));
    setNewNoteText('');
    success('Project coordination note broadcasted to PMC lead & contractor!');
  };

  // Resume On-Hold Project Request
  const handleRequestResume = (proj: InteriorProject) => {
    success(`Resume request for ${proj.projectId} submitted to BuildGhar Admin for site clearance.`);
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* ---------------- HEADER & VIEW SELECTOR ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black uppercase font-mono mb-1.5 border border-blue-200">
            <HardHat className="w-3.5 h-3.5 text-blue-600" />
            <span>Module 4 • Turnkey Project Management & Site Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Project Management & Execution Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Admin-governed tri-party project delivery synchronized across Customer, Interior Designer, and PMC Council with unique Project IDs (e.g. BG-2026-0002).
          </p>
        </div>

        {/* Rapid Jump Dropdown for 12 views */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={currentView}
              onChange={(e) => handleSetView(e.target.value as ProjectViewMode)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-950 shadow-2xs hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              {PROJECT_VIEW_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} ({tab.count})
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
          </div>

          <Link
            to="/interior-designer/designs"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-2 shadow-sm shrink-0"
          >
            <Box className="w-4 h-4" />
            <span className="hidden sm:inline">Design Studio</span>
          </Link>
        </div>
      </div>

      {/* ---------------- 12-PILL SUB-FEATURE ACTION STRIP ---------------- */}
      <div className="p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {PROJECT_VIEW_TABS.map((tab) => {
            const isActive = currentView === tab.id;
            const Icon = tab.icon;
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
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- SECTION 8 GOVERNANCE BANNER ---------------- */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Section 8 Governance Rule:</strong> Interior Designer operates under BuildGhar multi-party council supervision. Milestone activations, escrow releases, and handover certificates strictly require Admin clearance.
          </span>
        </div>
        <span className="font-mono font-bold bg-white text-amber-900 px-3 py-1 rounded-full border border-amber-200 shrink-0 text-[11px]">
          Admin Vault Secured
        </span>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: MY PROJECTS (MASTER LIST WITH FILTERS & INSPECT DOSSIER)          */}
      {/* ========================================================================= */}
      {currentView === 'MY_PROJECTS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4 Summary Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Assigned Projects</span>
              <div className="text-2xl font-black text-navy-950 font-display">{projects.length}</div>
              <span className="text-[11px] text-blue-700 font-semibold mt-0.5 block">{activeProjects.length} Active Sites</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Contract Value</span>
              <div className="text-xl font-black text-navy-950 font-mono truncate">{formatINR(totalContractSum)}</div>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Approved Commercial Scope</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Disbursed via Escrow</span>
              <div className="text-xl font-black text-emerald-700 font-mono truncate">{formatINR(totalPaidSum)}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Verified Milestones Released</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Escrow In Vault</span>
              <div className="text-xl font-black text-amber-700 font-mono truncate">{formatINR(pendingEscrowSum)}</div>
              <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">Secured in BuildGhar Vault</span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
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

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { tab: 'ALL', label: 'All Projects', count: projects.length },
                { tab: 'EXECUTION', label: 'Site Execution', count: projects.filter((p) => p.status === 'EXECUTION_IN_PROGRESS').length },
                { tab: 'DESIGN', label: 'Design Stage', count: projects.filter((p) => p.status === 'DESIGN_IN_PROGRESS').length },
                { tab: 'KICKOFF', label: 'Pending Kickoff', count: newAssignments.length },
                { tab: 'COMPLETED', label: 'Completed', count: completedProjects.length },
                { tab: 'ON_HOLD', label: 'On Hold', count: onHoldProjects.length },
              ].map((t) => (
                <button
                  key={t.tab}
                  onClick={() => setFilterTab(t.tab as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    filterTab === t.tab ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filterTab === t.tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-blue-700 text-xs bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {p.projectId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        p.status === 'COMPLETED'
                          ? 'bg-purple-100 text-purple-800'
                          : p.status === 'EXECUTION_IN_PROGRESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'DESIGN_IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : p.status === 'ON_HOLD'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-navy-950 text-base">{p.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                  </div>

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

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Verified Milestone Progress</span>
                      <span className="font-mono text-blue-700">{p.overallProgressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.overallProgressPercent === 100 ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${p.overallProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Target: {p.targetEndDate}
                  </span>
                  <div className="flex items-center gap-1.5">
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: NEW PROJECT ASSIGNMENTS                                           */}
      {/* ========================================================================= */}
      {currentView === 'NEW_ASSIGNMENTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">New Project Assignments Pending Kickoff</h3>
                <p className="text-xs text-slate-600">
                  Projects officially awarded to you by BuildGhar Admin. Complete site demarcation and kickoff protocol to begin fabrication.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              {newAssignments.length} Pending
            </span>
          </div>

          {newAssignments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-navy-950">No Pending New Assignments</h4>
              <p className="text-xs text-slate-500 mt-1">All assigned projects have been kicked off into design or execution.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newAssignments.map((p) => (
                <div key={p.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-700 text-xs bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        {p.projectId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                        {p.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400">• Assigned on {p.updatedAt.slice(0, 10)}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-navy-950">{p.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{p.projectAddress}</span>
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.approvedScope.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-2 w-full md:w-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Contract Value</span>
                      <span className="font-mono font-black text-navy-950 text-base">{formatINR(p.totalContractValue)}</span>
                    </div>
                    <div className="flex flex-wrap md:flex-col gap-2">
                      <button
                        onClick={() => {
                          setActiveProjectId(p.id);
                          handleSetView('PROJECT_KICKOFF');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Initiate Kickoff</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(p);
                          setModalTab('BRIEF');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Review Brief</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: PROJECT OVERVIEW (EXECUTIVE PORTFOLIO DASHBOARD)                   */}
      {/* ========================================================================= */}
      {currentView === 'PROJECT_OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-900 to-navy-950 text-white shadow-md">
              <span className="text-[10px] font-bold text-blue-200 uppercase block tracking-wider">Portfolio Contract Value</span>
              <div className="text-2xl font-black font-mono mt-1">{formatINR(totalContractSum)}</div>
              <div className="text-xs text-blue-200/80 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Across {projects.length} turnkey contracts</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Escrow Disbursed</span>
              <div className="text-2xl font-black font-mono text-emerald-600 mt-1">{formatINR(totalPaidSum)}</div>
              <span className="text-xs text-slate-500 mt-2 block">
                {Math.round((totalPaidSum / (totalContractSum || 1)) * 100)}% Milestone clearance rate
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Locked in Escrow Vault</span>
              <div className="text-2xl font-black font-mono text-amber-600 mt-1">{formatINR(pendingEscrowSum)}</div>
              <span className="text-xs text-slate-500 mt-2 block">Awaiting next milestone sign-off</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Active Execution Sites</span>
              <div className="text-2xl font-black font-display text-navy-950 mt-1">{activeProjects.length}</div>
              <span className="text-xs text-blue-600 mt-2 block font-semibold">Under daily PMC supervision</span>
            </div>
          </div>

          {/* Active Sites Executive Status Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-navy-950 text-base">Active Projects Health & Milestone Delivery</h3>
                <p className="text-xs text-slate-500 mt-0.5">High-level executive tracking of all assigned projects.</p>
              </div>
              <button
                onClick={() => handleSetView('PROJECT_TIMELINE')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Full Timeline View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3.5">Project ID & Title</th>
                    <th className="py-3 px-3.5">Client & Location</th>
                    <th className="py-3 px-3.5">Current Stage</th>
                    <th className="py-3 px-3.5">Contract Value</th>
                    <th className="py-3 px-3.5">Milestone Progress</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                            {p.projectId}
                          </span>
                          <span className="font-bold text-navy-950">{p.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-medium text-slate-800 block">{p.customerName}</span>
                        <span className="text-[11px] text-slate-400">{p.location}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                          {p.currentStage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-navy-950">
                        {formatINR(p.totalContractValue)}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[11px] font-mono font-bold">
                            <span>{p.overallProgressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.overallProgressPercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedProject(p);
                            setModalTab('OVERVIEW');
                          }}
                          className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition"
                        >
                          Dossier
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
      {/* VIEW 4: PROJECT KICKOFF                                                   */}
      {/* ========================================================================= */}
      {currentView === 'PROJECT_KICKOFF' && focusedProject && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Project Switcher Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Kickoff Dossier</span>
              <h3 className="text-base font-extrabold text-navy-950">{focusedProject.title} ({focusedProject.projectId})</h3>
            </div>
            <select
              value={focusedProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectId} - {p.customerName} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Kickoff Protocols Checklist */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-navy-950 text-base">Standard 5-Point Kickoff & Demarcation Protocol</h4>
                <p className="text-xs text-slate-500 mt-0.5">Section 8 requirement: All 5 steps must be verified prior to structural demolition or carpentry assembly.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-mono font-bold text-xs border border-blue-200">
                Kickoff Readiness: {
                  Object.values(kickoffStates[focusedProject.id] || {}).filter(Boolean).length
                } / 5
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'laserMeasurement' as keyof KickoffChecklist,
                  title: '1. Physical Site Measurement & As-Built Demarcation',
                  desc: 'Laser measurement of all rooms, door openings, window sill heights, and ceiling drop levels against approved 2D drawings.',
                },
                {
                  key: 'societyNoc' as keyof KickoffChecklist,
                  title: '2. Society Permission, Gate Pass & Material Transport Window',
                  desc: 'RWA / Condominium association permit, labor gate passes, freight elevator access hours, and debris dumping clearance.',
                },
                {
                  key: 'structuralCheck' as keyof KickoffChecklist,
                  title: '3. Structural Column, Load-Bearing Wall & Duct Inspection',
                  desc: 'Verification that no shear walls or structural RCC columns will be damaged or chased during interior execution.',
                },
                {
                  key: 'servicesInspection' as keyof KickoffChecklist,
                  title: '4. Electrical Distribution Board & Plumbing Valve Verification',
                  desc: 'Main MCB isolation, concealed pipe tracing, water shut-off valve functioning, and provision for temporary site power.',
                },
                {
                  key: 'clientKickoffSignOff' as keyof KickoffChecklist,
                  title: '5. Client Site Meeting & Key Handover Protocol',
                  desc: 'Formal site handover meeting with homeowner, keys tagged, and initial milestone kickoff documented in BuildGhar vault.',
                },
              ].map((item) => {
                const isChecked = kickoffStates[focusedProject.id]?.[item.key] ?? false;
                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggleKickoff(focusedProject.id, item.key)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                      isChecked
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isChecked ? 'text-emerald-950' : 'text-navy-950'}`}>
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isChecked ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => success(`Kickoff dossier for ${focusedProject.projectId} saved and certified!`)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Certify Site Kickoff Readiness</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: PROJECT PLANNING                                                  */}
      {/* ========================================================================= */}
      {currentView === 'PROJECT_PLANNING' && focusedProject && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Project Switcher Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Planning Brief</span>
              <h3 className="text-base font-extrabold text-navy-950">{focusedProject.title} ({focusedProject.projectId})</h3>
            </div>
            <select
              value={focusedProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectId} - {p.customerName}
                </option>
              ))}
            </select>
          </div>

          {focusedProject.designBrief ? (
            <div className="space-y-5">
              {/* Specification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved Design Style</span>
                  <h4 className="font-black text-navy-950 text-sm">{focusedProject.designBrief.designStyle}</h4>
                  <p className="text-xs text-slate-600">{focusedProject.designBrief.customerRequirements}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Preferences</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {focusedProject.designBrief.materialPreferences.map((m, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Color Palette Chips</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {focusedProject.designBrief.colorPreferences.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <span>{c}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Lighting & Ceiling Specification</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {focusedProject.designBrief.lightingRequirements.map((l, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Room Breakdown Table */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-navy-950 text-sm uppercase tracking-wider">Room-by-Room Design & Space Planning</h4>
                  <Link
                    to={`/interior-designer/designs?projectId=${focusedProject.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Open in 3D Design Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">Room Name</th>
                        <th className="py-2.5 px-3">Dimensions</th>
                        <th className="py-2.5 px-3">Style & Palette</th>
                        <th className="py-2.5 px-3">Execution Requirements</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {focusedProject.designBrief.roomBreakdown.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-navy-950">{r.roomName}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{r.dimensions}</td>
                          <td className="py-2.5 px-3 text-slate-700">{r.style} • {r.colorScheme}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.requirements}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200">
              <Layers className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-navy-950">No Planning Brief Uploaded</h4>
              <p className="text-xs text-slate-500 mt-1">Please upload the approved design brief to begin space planning.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: PROJECT TIMELINE (8-PHASE ARCHITECTURAL ROADMAP)                   */}
      {/* ========================================================================= */}
      {currentView === 'PROJECT_TIMELINE' && focusedProject && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Project Switcher Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Project Roadmap</span>
              <h3 className="text-base font-extrabold text-navy-950">{focusedProject.title} ({focusedProject.projectId})</h3>
            </div>
            <select
              value={focusedProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectId} - {p.customerName} ({p.overallProgressPercent}%)
                </option>
              ))}
            </select>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-navy-950 text-base">Standard 8-Phase Architectural Execution Roadmap</h4>
                <p className="text-xs text-slate-500 mt-0.5">Sequential workflow from initial physical demarcation to final snag handover.</p>
              </div>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 text-xs">
                {focusedProject.overallProgressPercent}% Complete
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { num: 1, title: 'Phase 1: Site Measurement & Architectural Demarcation', status: 'COMPLETED', lead: 'Site Supervisor', weight: '10%' },
                { num: 2, title: 'Phase 2: Space Planning & 2D Working CAD Layouts', status: 'COMPLETED', lead: 'Interior Designer', weight: '15%' },
                { num: 3, title: 'Phase 3: 3D Visualization Renders & Moodboard Sign-Off', status: focusedProject.overallProgressPercent >= 25 ? 'COMPLETED' : 'IN_PROGRESS', lead: 'Interior Designer', weight: '15%' },
                { num: 4, title: 'Phase 4: Material Swatches & Dynamic BOQ Finalization', status: focusedProject.overallProgressPercent >= 35 ? 'COMPLETED' : 'IN_PROGRESS', lead: 'Designer & Vendor', weight: '10%' },
                { num: 5, title: 'Phase 5: Civil Demolition, Electrical & Ceiling Framing', status: focusedProject.overallProgressPercent >= 45 ? 'IN_PROGRESS' : 'PENDING', lead: 'Contractor & PMC', weight: '20%' },
                { num: 6, title: 'Phase 6: Modular Carcass Fabrication & Assembly', status: focusedProject.overallProgressPercent >= 70 ? 'IN_PROGRESS' : 'PENDING', lead: 'Woodcraft Contractor', weight: '15%' },
                { num: 7, title: 'Phase 7: Finishes, Painting, Wallpaper & Lighting Installation', status: focusedProject.overallProgressPercent >= 85 ? 'IN_PROGRESS' : 'PENDING', lead: 'Finishing Contractors', weight: '10%' },
                { num: 8, title: 'Phase 8: Snag Rectification, Deep Cleaning & Handover', status: focusedProject.overallProgressPercent === 100 ? 'COMPLETED' : 'PENDING', lead: 'PMC & Homeowner', weight: '5%' },
              ].map((phase) => (
                <div key={phase.num} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        phase.status === 'COMPLETED'
                          ? 'bg-emerald-600 text-white'
                          : phase.status === 'IN_PROGRESS'
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {phase.status === 'COMPLETED' ? <Check className="w-4 h-4" /> : phase.num}
                    </div>
                    <div>
                      <span className="font-bold text-navy-950 block">{phase.title}</span>
                      <span className="text-[11px] text-slate-400">Phase Weight: {phase.weight} • Lead: {phase.lead}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      phase.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : phase.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {phase.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 7: PROJECT TASKS (WBS SITE WORK BREAKDOWN)                           */}
      {/* ========================================================================= */}
      {currentView === 'PROJECT_TASKS' && focusedProject && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Project Switcher Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Project Task List</span>
              <h3 className="text-base font-extrabold text-navy-950">{focusedProject.title} ({focusedProject.projectId})</h3>
            </div>
            <select
              value={focusedProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectId} - {p.customerName}
                </option>
              ))}
            </select>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-navy-950 text-base">Site Execution Tasks & WBS Checklist</h4>
                <p className="text-xs text-slate-500 mt-0.5">Click task to toggle completion status. Changes propagate to PMC site records.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                {(projectTasks[focusedProject.id] || []).filter((t) => t.completed).length} / {(projectTasks[focusedProject.id] || []).length} Finished
              </span>
            </div>

            <div className="space-y-2.5">
              {(projectTasks[focusedProject.id] || []).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No tasks recorded for this project yet.</div>
              ) : (
                (projectTasks[focusedProject.id] || []).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(focusedProject.id, t.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between text-xs ${
                      t.completed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition shrink-0 ${
                          t.completed ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {t.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className={`font-bold ${t.completed ? 'text-slate-500 line-through' : 'text-navy-950'}`}>
                          {t.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-600 font-bold">
                            {t.category}
                          </span>
                          <span>Assignee: {t.assignee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Due Date</span>
                      <span className="font-mono text-[11px] font-bold text-navy-950">{t.dueDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 8: PROJECT SCHEDULE (MILESTONE CALENDAR & DEADLINES)                  */}
      {/* ========================================================================= */}
      {currentView === 'PROJECT_SCHEDULE' && focusedProject && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Project Switcher Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Project Schedule</span>
              <h3 className="text-base font-extrabold text-navy-950">{focusedProject.title} ({focusedProject.projectId})</h3>
            </div>
            <select
              value={focusedProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectId} - {p.customerName}
                </option>
              ))}
            </select>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-navy-950 text-base">Key Milestones & Inspection Schedule</h4>
                <p className="text-xs text-slate-500 mt-0.5">Chronological delivery calendar with contractual escrow trigger dates.</p>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Start: <strong className="text-navy-950 font-mono">{focusedProject.startDate}</strong> • Handover: <strong className="text-navy-950 font-mono">{focusedProject.targetEndDate}</strong>
              </span>
            </div>

            <div className="space-y-3">
              {focusedProject.milestones.map((m, idx) => (
                <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-black flex items-center justify-center shrink-0 text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <h5 className="font-bold text-navy-950">{m.name}</h5>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Target Completion: <strong className="font-mono text-navy-950">{m.dueDate}</strong> • Weight: {m.weightPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="font-mono font-black text-navy-950 text-sm block">{formatINR(m.payoutAmount)}</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 9: PROJECT COORDINATION (MULTI-PARTY PMC DESK)                       */}
      {/* ========================================================================= */}
      {currentView === 'PROJECT_COORDINATION' && focusedProject && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Project Switcher Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Project Council</span>
              <h3 className="text-base font-extrabold text-navy-950">{focusedProject.title} ({focusedProject.projectId})</h3>
            </div>
            <select
              value={focusedProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectId} - {p.customerName}
                </option>
              ))}
            </select>
          </div>

          {/* Tri-Party Stakeholder Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Client / Homeowner</span>
              <h5 className="font-extrabold text-navy-950 text-sm">{focusedProject.customerName}</h5>
              <p className="text-xs text-slate-500">{focusedProject.customerPhone}</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold mt-1">
                Direct WhatsApp Channel Active
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Execution Contractor</span>
              <h5 className="font-extrabold text-navy-950 text-sm">{focusedProject.assignedContractor || 'Apex Civil & Woodcraft'}</h5>
              <p className="text-xs text-slate-500">Verified Partner • Lead: Sh. Rajendra</p>
              <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold mt-1">
                Site Workforce: 8 Craftsmen
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">BuildGhar PMC Supervisor</span>
              <h5 className="font-extrabold text-navy-950 text-sm">{focusedProject.assignedSiteSupervisor || 'Er. Sandeep Yadav'}</h5>
              <p className="text-xs text-slate-500">Senior Civil Council • Daily Site Audits</p>
              <span className="inline-block px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-bold mt-1">
                Quality Inspection Clearance: A+
              </span>
            </div>
          </div>

          {/* Live Coordination Broadcast Log */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-extrabold text-navy-950 text-base">Multi-Party Coordination Stream</h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Post site update, material delivery alert, or inspection note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-navy-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleAddNote}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {(coordinationNotes[focusedProject.id] || []).length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">No coordination notes posted yet.</div>
              ) : (
                (coordinationNotes[focusedProject.id] || []).map((note) => (
                  <div key={note.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950">{note.author}</span>
                        <span className="text-[10px] font-mono bg-white px-2 py-0.2 rounded border border-slate-200 text-slate-500 font-bold">
                          {note.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{note.time}</span>
                    </div>
                    <p className="text-slate-700">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 10: PROJECT STATUS (STAGE-BY-STAGE STEPPER)                           */}
      {/* ========================================================================= */}
      {currentView === 'PROJECT_STATUS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
            <h3 className="font-bold text-navy-950 text-sm">Real-Time Project Stage Lifecycle</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Live status progression across the 7 mandatory BuildGhar project stages from Consultation to Final Handover.
            </p>
          </div>

          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 text-xs">
                      {p.projectId}
                    </span>
                    <h4 className="font-extrabold text-navy-950 text-sm">{p.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Milestone Progress:</span>
                    <span className="font-mono font-bold text-blue-700 text-xs">{p.overallProgressPercent}%</span>
                  </div>
                </div>

                {/* 7-Stage Visual Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[10px]">
                  {[
                    { stage: 'INITIAL_CONSULTATION', label: '1. Consultation' },
                    { stage: 'SPACE_PLANNING_2D', label: '2. 2D Layout' },
                    { stage: 'VISUALIZATION_3D', label: '3. 3D Renders' },
                    { stage: 'MATERIAL_SELECTION', label: '4. Materials' },
                    { stage: 'ESTIMATION_BOQ', label: '5. BOQ Sign-off' },
                    { stage: 'SITE_EXECUTION', label: '6. Site Execution' },
                    { stage: 'COMPLETED', label: '7. Handover' },
                  ].map((st, i) => {
                    const isPassed =
                      (p.overallProgressPercent >= 100 && i <= 6) ||
                      (p.overallProgressPercent >= 60 && i <= 5) ||
                      (p.overallProgressPercent >= 40 && i <= 4) ||
                      (p.overallProgressPercent >= 25 && i <= 2) ||
                      i === 0;
                    const isCurrent = p.currentStage === st.stage;

                    return (
                      <div
                        key={st.stage}
                        className={`p-2 rounded-xl border transition ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
                            : isPassed
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                      >
                        <div className="truncate">{st.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 11: COMPLETED PROJECTS (SUCCESSFULLY DELIVERED TURNKEY SITES)        */}
      {/* ========================================================================= */}
      {currentView === 'COMPLETED_PROJECTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderCheck className="w-5 h-5 text-purple-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Successfully Completed & Handed Over Projects</h3>
                <p className="text-xs text-slate-600">
                  Turnkey projects delivered with 100% verified milestone clearance and zero pending snags.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-purple-900 border border-purple-200 font-mono font-bold text-xs">
              {completedProjects.length} Delivered
            </span>
          </div>

          {completedProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200">
              <FolderCheck className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-navy-950">No Completed Projects Yet</h4>
              <p className="text-xs text-slate-500 mt-1">Projects will show here once final snag clearance and client handover are verified.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedProjects.map((p) => (
                <div key={p.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-purple-700 text-xs bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                        {p.projectId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Handover Complete</span>
                      </span>
                      <span className="text-xs text-slate-400">• Completed on {p.updatedAt.slice(0, 10)}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-navy-950">{p.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{p.location}</span>
                    </p>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex flex-wrap gap-4">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Client</span>
                        <span className="font-bold text-navy-950">{p.customerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Final Contract Value</span>
                        <span className="font-mono font-bold text-emerald-700">{formatINR(p.totalContractValue)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Escrow Clearance</span>
                        <span className="font-mono font-bold text-emerald-700">100% Disbursed</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-2 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setModalTab('DOCS');
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Handover Certificate</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setModalTab('OVERVIEW');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 w-full"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 12: ON-HOLD PROJECTS                                                 */}
      {/* ========================================================================= */}
      {currentView === 'ON_HOLD_PROJECTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PauseCircle className="w-5 h-5 text-rose-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">On-Hold & Temporarily Paused Projects</h3>
                <p className="text-xs text-slate-600">
                  Projects suspended due to structural revisions, RWA condominium clearance, or customer variation requests.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-rose-900 border border-rose-200 font-mono font-bold text-xs">
              {onHoldProjects.length} Paused
            </span>
          </div>

          {onHoldProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-navy-950">No Projects On Hold</h4>
              <p className="text-xs text-slate-500 mt-1">All active sites are operating smoothly on schedule.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {onHoldProjects.map((p) => (
                <div key={p.id} className="p-5 rounded-3xl bg-white border border-rose-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-rose-700 text-xs bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        {p.projectId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                        ON HOLD (35 Days)
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-navy-950">{p.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{p.location}</span>
                    </p>

                    <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Hold Reason & Resolution Pathway:</span>
                      </div>
                      <p className="text-rose-900 text-[11px]">{p.notes || 'Awaiting customer layout revision clearance.'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-2 w-full md:w-auto">
                    <button
                      onClick={() => handleRequestResume(p)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs w-full"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Request Admin Clearance / Resume</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setModalTab('OVERVIEW');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 w-full"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                        selectedProject.status === 'COMPLETED'
                          ? 'bg-purple-100 text-purple-800'
                          : selectedProject.status === 'EXECUTION_IN_PROGRESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedProject.status === 'ON_HOLD'
                          ? 'bg-rose-100 text-rose-800'
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
                      modalTab === t.tab ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
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
                      <span className="font-mono font-bold text-navy-950">{formatINR(selectedProject.totalContractValue)}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Handover</span>
                      <span className="font-bold text-navy-950">{selectedProject.targetEndDate}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="text-slate-400 uppercase font-bold text-[10px] block mb-0.5">Project Site Address</span>
                    <span className="font-bold text-navy-950">{selectedProject.projectAddress}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-navy-950 block">Approved Commercial Scope (Accepted Quotation):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProject.approvedScope.map((scope, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[11px]">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>

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

              {/* TAB 2: DESIGN BRIEF */}
              {modalTab === 'BRIEF' && (
                <div className="space-y-4">
                  {selectedProject.designBrief ? (
                    <>
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Admin-Approved Brief:</strong> Interior Designer must work strictly from this approved brief. New requirements must be routed through Admin as official change requests.
                          </span>
                        </div>
                        <span className="font-mono font-bold bg-white text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          Approved {selectedProject.designBrief.approvedAt.slice(0, 10)}
                        </span>
                      </div>

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
                      </div>

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
                    <div className="p-8 text-center text-slate-400 text-xs">No design brief uploaded yet.</div>
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
                      <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
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
                          <span className="font-mono font-black text-navy-950 text-sm block">{formatINR(m.payoutAmount)}</span>
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
                      <div key={step.num} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
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
                        <div key={doc.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
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
