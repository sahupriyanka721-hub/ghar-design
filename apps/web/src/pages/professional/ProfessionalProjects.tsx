import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getExecutionProjects,
  saveExecutionProject,
  calculateProjectWeightedProgress,
  ExecutionProject,
  ExecutionStage,
  ExecutionTask,
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
  Check,
  Users,
  Phone,
  Mail,
  ShieldCheck,
  ClipboardList,
  Filter,
  Sparkles,
  ExternalLink,
  Briefcase,
  AlertCircle,
  Share2,
} from 'lucide-react';

type TabKey = 'overview' | 'kickoff' | 'planning' | 'tasks' | 'coordination' | 'progress';

interface ArchitecturalTaskItem {
  id: string;
  stageId: string;
  stageName: string;
  title: string;
  assignee: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  status: 'TODO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED';
  dueDate: string;
  deliverableType: string;
}

export const ProfessionalProjects: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab from query param or default to 'overview'
  const activeTab = (searchParams.get('tab') as TabKey) || 'overview';
  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  const [projects, setProjects] = useState<ExecutionProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ExecutionProject | null>(null);

  // Progress update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [newProgressPercent, setNewProgressPercent] = useState<number>(50);
  const [updateNotes, setUpdateNotes] = useState('');
  const [issuesEncountered, setIssuesEncountered] = useState('');
  const [nextActivity, setNextActivity] = useState('');

  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStage, setNewTaskStage] = useState('Stage 3: 3D Elevation & Facade Renders');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Lead Architect');
  const [newTaskPriority, setNewTaskPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('HIGH');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Meeting Scheduler Modal State
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingSubject, setMeetingSubject] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('11:00 AM');
  const [meetingAttendees, setMeetingAttendees] = useState('Client, Structural Consultant, Contractor');

  // Task Filter state
  const [taskFilterStatus, setTaskFilterStatus] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Seed realistic architectural project if empty
  const ensureArchitecturalProject = (existingList: ExecutionProject[]): ExecutionProject[] => {
    if (existingList.length > 0) return existingList;

    const defaultArchProject: ExecutionProject = {
      id: 'PRJ-2026-ARCH-01',
      requestCode: 'GHR-REQ-2026-0011',
      quotationId: 'QT-2026-ARCH-001',
      quotationCode: 'QT-2026-ARCH-001',
      bookingCode: 'BK-2026-8802',
      workOrderNumber: 'GHR-WO-2026-088',
      name: 'Modern Luxury Villa (G+2) - Super Corridor',
      customerId: 'CUST-IND-992',
      customerName: 'Sharika Mishra',
      customerPhone: '+91 9876543210',
      propertyAddress: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
      city: 'Indore',
      state: 'Madhya Pradesh',
      serviceType: 'Full Architectural & Structural IS 456 Design',
      category: 'PLANNING',
      contractorId: 'arch-self',
      contractorName: user?.name || 'Lead Architect & Associates',
      contractorFirm: 'Apex Architectural Studio',
      contractorPhone: user?.phone || '+91 9876543210',
      contractorRole: 'PRINCIPAL_ARCHITECT',
      status: 'IN_PROGRESS',
      plannedStartDate: '2026-11-01',
      plannedEndDate: '2027-02-28',
      actualStartDate: '2026-11-05',
      contractValuePaise: 24000000,
      totalContractPaise: 24000000,
      plotAreaSqFt: 2400,
      builtUpAreaSqFt: 4200,
      weightedProgressPercent: 55,
      overallVerifiedProgress: 55,
      overallReportedProgress: 55,
      kickoffInfo: {
        advanceRequiredPaise: 4800000,
        advancePaid: true,
        advancePaidPaise: 4800000,
        siteDemarcationReady: true,
        sanctionReceived: true,
        utilityConnectionReady: true,
        contractAgreed: true,
        specialInstructions: 'Vastu compliance required for North-East entrance and South-West Master Suite. IS 456 ductile detailing for seismic Zone III.',
        confirmedAt: '2026-11-05T10:30:00Z',
      },
      stages: [
        {
          id: 'stg-1',
          stageNumber: 1,
          name: 'Stage 1: Concept Design & Site Analysis',
          category: 'PLANNING',
          description: 'Topography analysis, Vastu zoning, setback planning, and preliminary client brief validation.',
          weightPercent: 20,
          status: 'COMPLETED',
          plannedStartDate: '2026-11-05',
          plannedEndDate: '2026-11-20',
          reportedProgress: 100,
          verifiedProgress: 100,
          tasks: [
            {
              id: 'tsk-101',
              title: 'Site boundary demarcation & contour survey vetting',
              weight: 50,
              status: 'COMPLETED',
              reportedFraction: 1,
              verifiedFraction: 1,
            },
            {
              id: 'tsk-102',
              title: 'Vastu orientation layout & primary zoning matrix',
              weight: 50,
              status: 'COMPLETED',
              reportedFraction: 1,
              verifiedFraction: 1,
            },
          ],
        },
        {
          id: 'stg-2',
          stageNumber: 2,
          name: 'Stage 2: Municipal & Preliminary Floor Plans',
          category: 'PLANNING',
          description: 'G+2 comprehensive floor plans, room dimensional schedules, and municipal sanction vetting.',
          weightPercent: 20,
          status: 'COMPLETED',
          plannedStartDate: '2026-11-21',
          plannedEndDate: '2026-12-05',
          reportedProgress: 100,
          verifiedProgress: 100,
          tasks: [
            {
              id: 'tsk-201',
              title: 'Detailed 2D furniture layout & circulation paths',
              weight: 50,
              status: 'COMPLETED',
              reportedFraction: 1,
              verifiedFraction: 1,
            },
            {
              id: 'tsk-202',
              title: 'Municipal bylaws & setback verification checklist',
              weight: 50,
              status: 'COMPLETED',
              reportedFraction: 1,
              verifiedFraction: 1,
            },
          ],
        },
        {
          id: 'stg-3',
          stageNumber: 3,
          name: 'Stage 3: 3D Elevation & Facade Renders',
          category: 'PLANNING',
          description: 'Contemporary facade modeling, daylight study, material textures, and photorealistic 4K renders.',
          weightPercent: 20,
          status: 'IN_PROGRESS',
          plannedStartDate: '2026-12-06',
          plannedEndDate: '2026-12-25',
          reportedProgress: 75,
          verifiedProgress: 75,
          tasks: [
            {
              id: 'tsk-301',
              title: '3D exterior model creation with louvers & cladding',
              weight: 50,
              status: 'COMPLETED',
              reportedFraction: 1,
              verifiedFraction: 1,
            },
            {
              id: 'tsk-302',
              title: 'Photorealistic render iteration with evening lighting',
              weight: 50,
              status: 'IN_PROGRESS',
              reportedFraction: 0.5,
              verifiedFraction: 0.5,
            },
          ],
        },
        {
          id: 'stg-4',
          stageNumber: 4,
          name: 'Stage 4: Structural IS 456 Engineering & BBS',
          category: 'PLANNING',
          description: 'STAAD.Pro load analysis, foundation design, column-beam schedule, and bar bending schedule.',
          weightPercent: 25,
          status: 'IN_PROGRESS',
          plannedStartDate: '2026-12-26',
          plannedEndDate: '2027-01-20',
          reportedProgress: 30,
          verifiedProgress: 30,
          tasks: [
            {
              id: 'tsk-401',
              title: 'Dead, Live, and Wind/Seismic load calculations IS 875',
              weight: 50,
              status: 'COMPLETED',
              reportedFraction: 1,
              verifiedFraction: 1,
            },
            {
              id: 'tsk-402',
              title: 'Column reinforcement schedule and footing details',
              weight: 50,
              status: 'IN_PROGRESS',
              reportedFraction: 0.3,
              verifiedFraction: 0.3,
            },
          ],
        },
        {
          id: 'stg-5',
          stageNumber: 5,
          name: 'Stage 5: Working Drawings & Final Documentation',
          category: 'PLANNING',
          description: 'MEP electrical/plumbing conduit layouts, door/window joinery, and site execution dossiers.',
          weightPercent: 15,
          status: 'NOT_STARTED',
          plannedStartDate: '2027-01-21',
          plannedEndDate: '2027-02-28',
          reportedProgress: 0,
          verifiedProgress: 0,
          tasks: [
            {
              id: 'tsk-501',
              title: 'Internal plumbing, drainage & rainwater harvesting layout',
              weight: 50,
              status: 'NOT_STARTED',
              reportedFraction: 0,
              verifiedFraction: 0,
            },
            {
              id: 'tsk-502',
              title: 'Final construction blueprint package for contractor handover',
              weight: 50,
              status: 'NOT_STARTED',
              reportedFraction: 0,
              verifiedFraction: 0,
            },
          ],
        },
      ],
      dailyReports: [
        {
          id: 'rep-01',
          reportDate: '2026-11-20',
          submittedAt: '2026-11-20T16:00:00Z',
          submittedBy: user?.name || 'Lead Architect',
          weather: 'Sunny / Clear',
          workersPresent: 4,
          workPerformed: 'Preliminary on-site level measurement completed. Verified road level bench mark.',
          tasksUpdated: ['Site boundary demarcation'],
          quantitiesCompleted: '100% Boundary pegging',
          materialsReceived: 'Soil test core sample report',
          materialsConsumed: 'Survey flags & marker paint',
          equipmentUsed: 'Total Station & Auto-Level',
          sitePhotos: [],
          blockers: 'None. Site access is clear via 40ft main road.',
          safetyObservations: 'Site fenced and secure.',
          nextPlannedActivities: 'Release Stage 2 floor plan drawings to client for sign-off.',
          customerComments: [],
        },
      ],
      documents: [],
      chatMessages: [],
      snagList: [],
      issues: [],
      changeOrders: [],
      createdAt: '2026-11-01T09:00:00Z',
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(defaultArchProject);
    return [defaultArchProject];
  };

  const loadProjects = () => {
    const rawList = getExecutionProjects();
    const list = ensureArchitecturalProject(rawList);
    setProjects(list);
    if (list.length > 0) {
      if (!selectedProject || !list.some((p) => p.id === selectedProject.id)) {
        setSelectedProject(list[0]);
      } else {
        const refreshed = list.find((p) => p.id === selectedProject.id);
        if (refreshed) setSelectedProject(refreshed);
      }
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Compute live architectural tasks from stages
  const architecturalTasks: ArchitecturalTaskItem[] = useMemo(() => {
    if (!selectedProject || !selectedProject.stages) return [];

    const result: ArchitecturalTaskItem[] = [];
    selectedProject.stages.forEach((stage, sIdx) => {
      (stage.tasks || []).forEach((t, tIdx) => {
        let taskStatus: 'TODO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' = 'TODO';
        if (t.status === 'COMPLETED') taskStatus = 'COMPLETED';
        else if (t.status === 'IN_PROGRESS' || t.reportedFraction > 0) taskStatus = 'IN_PROGRESS';
        else if (t.status === 'SUBMITTED') taskStatus = 'UNDER_REVIEW';

        result.push({
          id: t.id || `tsk-${sIdx}-${tIdx}`,
          stageId: stage.id,
          stageName: stage.name,
          title: t.title,
          assignee: sIdx < 2 ? 'Lead Architect' : sIdx === 2 ? '3D Visualizer' : sIdx === 3 ? 'Structural Engineer' : 'MEP Consultant',
          priority: sIdx === 2 || sIdx === 3 ? 'HIGH' : sIdx === 0 ? 'NORMAL' : 'URGENT',
          status: taskStatus,
          dueDate: stage.plannedEndDate,
          deliverableType: sIdx === 2 ? '3D Render / CAD' : sIdx === 3 ? 'IS 456 Structural DWG' : 'Architectural PDF',
        });
      });
    });

    return result;
  }, [selectedProject]);

  const filteredTasks = useMemo(() => {
    if (taskFilterStatus === 'ALL') return architecturalTasks;
    return architecturalTasks.filter((t) => t.status === taskFilterStatus);
  }, [architecturalTasks, taskFilterStatus]);

  // Handle Project Selection
  const handleSelectProject = (proj: ExecutionProject) => {
    setSelectedProject(proj);
  };

  // Toggle Kickoff Checklist item
  const handleToggleKickoffItem = (field: keyof typeof selectedProject.kickoffInfo) => {
    if (!selectedProject) return;

    const currentKickoff = selectedProject.kickoffInfo || {
      advanceRequiredPaise: 4800000,
      advancePaid: true,
      advancePaidPaise: 4800000,
      siteDemarcationReady: true,
      sanctionReceived: true,
      utilityConnectionReady: true,
      contractAgreed: true,
      specialInstructions: '',
    };

    const updatedKickoff = {
      ...currentKickoff,
      [field]: !currentKickoff[field],
      confirmedAt: new Date().toISOString(),
    };

    const updatedProject: ExecutionProject = {
      ...selectedProject,
      kickoffInfo: updatedKickoff,
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(updatedProject);
    setSelectedProject(updatedProject);
    success('Project kickoff checklist synchronized successfully!');
    loadProjects();
  };

  // Open Update Progress Modal
  const handleOpenUpdate = (proj: ExecutionProject, stageIdx: number) => {
    setSelectedProject(proj);
    setSelectedStageIndex(stageIdx);
    const stage = proj.stages[stageIdx];
    setNewProgressPercent(stage ? stage.reportedProgress || stage.verifiedProgress || 0 : 0);
    setUpdateNotes('');
    setIssuesEncountered('');
    setNextActivity('');
    setShowUpdateModal(true);
  };

  // Save Progress
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
          reportedProgress: newProgressPercent,
          verifiedProgress: newProgressPercent,
          status: (newProgressPercent === 100 ? 'COMPLETED' : newProgressPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED') as any,
        };
      }
      return stg;
    });

    const newWeighted = calculateProjectWeightedProgress(updatedStages);

    const newReports = [...(selectedProject.dailyReports || [])];
    if (updateNotes) {
      newReports.unshift({
        id: `rep-${Date.now()}`,
        reportDate: new Date().toISOString().split('T')[0],
        submittedAt: new Date().toISOString(),
        submittedBy: user?.name || 'Lead Architect',
        weather: 'Sunny / Clear',
        workersPresent: 6,
        workPerformed: `[${currentStage.name}]: ${updateNotes}`,
        tasksUpdated: [currentStage.name],
        quantitiesCompleted: `${newProgressPercent}% Stage Completion`,
        materialsReceived: 'Drawing approval sheet',
        materialsConsumed: 'Printing / CAD computation',
        equipmentUsed: 'Workstations / CAD / STAAD',
        sitePhotos: [],
        blockers: issuesEncountered || 'None',
        safetyObservations: 'Compliance verified.',
        nextPlannedActivities: nextActivity || 'Continue next design deliverable.',
        customerComments: [],
      });
    }

    const updatedProject: ExecutionProject = {
      ...selectedProject,
      stages: updatedStages,
      weightedProgressPercent: newWeighted.verifiedProgress,
      overallVerifiedProgress: newWeighted.verifiedProgress,
      overallReportedProgress: newWeighted.reportedProgress,
      dailyReports: newReports,
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(updatedProject);
    setSelectedProject(updatedProject);
    success(`Progress updated to ${newProgressPercent}% for "${currentStage.name}"!`);
    setShowUpdateModal(false);
    loadProjects();
  };

  // Toggle Task Completion
  const handleToggleTask = (taskItem: ArchitecturalTaskItem) => {
    if (!selectedProject) return;

    const updatedStages = (selectedProject.stages || []).map((stg) => {
      if (stg.id === taskItem.stageId || stg.name === taskItem.stageName) {
        const updatedTasks = (stg.tasks || []).map((t) => {
          if (t.id === taskItem.id || t.title === taskItem.title) {
            const isDone = t.status === 'COMPLETED';
            return {
              ...t,
              status: isDone ? ('IN_PROGRESS' as const) : ('COMPLETED' as const),
              reportedFraction: isDone ? 0.5 : 1.0,
              verifiedFraction: isDone ? 0.5 : 1.0,
            };
          }
          return t;
        });

        // Compute stage progress from tasks
        const completedCount = updatedTasks.filter((t) => t.status === 'COMPLETED').length;
        const totalCount = updatedTasks.length || 1;
        const stageProgress = Math.round((completedCount / totalCount) * 100);

        return {
          ...stg,
          tasks: updatedTasks,
          reportedProgress: stageProgress,
          verifiedProgress: stageProgress,
          status: stageProgress === 100 ? ('COMPLETED' as const) : ('IN_PROGRESS' as const),
        };
      }
      return stg;
    });

    const newWeighted = calculateProjectWeightedProgress(updatedStages);

    const updatedProject: ExecutionProject = {
      ...selectedProject,
      stages: updatedStages,
      weightedProgressPercent: newWeighted.verifiedProgress,
      overallVerifiedProgress: newWeighted.verifiedProgress,
      overallReportedProgress: newWeighted.reportedProgress,
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(updatedProject);
    setSelectedProject(updatedProject);
    success(`Task status updated for "${taskItem.title}"!`);
    loadProjects();
  };

  // Add Custom Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskTitle.trim()) return;

    const targetStageIndex = selectedProject.stages.findIndex((s) => s.name === newTaskStage) >= 0
      ? selectedProject.stages.findIndex((s) => s.name === newTaskStage)
      : 0;

    const newTask: ExecutionTask = {
      id: `tsk-${Date.now()}`,
      title: newTaskTitle.trim(),
      weight: 25,
      status: 'NOT_STARTED',
      reportedFraction: 0,
      verifiedFraction: 0,
    };

    const updatedStages = selectedProject.stages.map((stg, idx) => {
      if (idx === targetStageIndex) {
        return {
          ...stg,
          tasks: [...(stg.tasks || []), newTask],
        };
      }
      return stg;
    });

    const updatedProject: ExecutionProject = {
      ...selectedProject,
      stages: updatedStages,
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(updatedProject);
    setSelectedProject(updatedProject);
    success(`Added task "${newTaskTitle}" to ${selectedProject.stages[targetStageIndex].name}`);
    setNewTaskTitle('');
    setShowAddTaskModal(false);
    loadProjects();
  };

  // Schedule Review Meeting
  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingSubject || !meetingDate) {
      error('Please specify a meeting subject and date.');
      return;
    }

    success(`Design Review Meeting scheduled for ${meetingDate} at ${meetingTime}! Invitations sent.`);
    setShowMeetingModal(false);
    setMeetingSubject('');
  };

  const currentKickoff = selectedProject?.kickoffInfo || {
    advanceRequiredPaise: 4800000,
    advancePaid: true,
    advancePaidPaise: 4800000,
    siteDemarcationReady: true,
    sanctionReceived: true,
    utilityConnectionReady: true,
    contractAgreed: true,
    specialInstructions: 'North-facing Vastu compliance. IS 456 ductile detailing for earthquake Zone III.',
  };

  const kickoffCompletedCount = [
    currentKickoff.advancePaid,
    currentKickoff.siteDemarcationReady,
    currentKickoff.sanctionReceived,
    currentKickoff.utilityConnectionReady,
    currentKickoff.contractAgreed,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 4)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <HardHat className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  4. Architectural Project Management & Planning
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  {projects.length} Active Projects
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                IS 456 compliance, stage milestones, architectural kickoff checklists, and joint stakeholder coordination.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowMeetingModal(true)}
            className="text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-sky-600" />
            <span>Schedule Review</span>
          </button>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PROJECT SELECTOR & MASTER KPI CARDS
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Selected Engagement</span>
          <div className="mt-1 font-bold text-slate-900 text-sm truncate">
            {selectedProject?.name || 'No Project Selected'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
            {selectedProject?.workOrderNumber || selectedProject?.requestCode}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Weighted Progress</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-sky-900 font-mono">
              {Math.round(selectedProject?.weightedProgressPercent || selectedProject?.overallVerifiedProgress || 0)}%
            </span>
            <span className="text-[10px] font-bold text-slate-500">IS 456 Vetted</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.round(selectedProject?.weightedProgressPercent || selectedProject?.overallVerifiedProgress || 0)}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Kickoff Readiness</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-blue-900 font-mono">
              {kickoffCompletedCount}/5
            </span>
            <span className="text-[10px] font-bold text-blue-900">
              {kickoffCompletedCount === 5 ? 'Fully Ready' : 'In Progress'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Client Advance Verified</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Professional Fee</span>
          <div className="mt-1 text-xl font-black text-blue-900 font-mono">
            {formatINR(selectedProject?.contractValuePaise || selectedProject?.totalContractPaise || 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Milestone Escrow Backed</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4 SUB-NAVIGATION TABS (4.1 to 4.7)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>4.1 & 4.2 Project Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('kickoff')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'kickoff'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4.3 Project Kickoff</span>
            {kickoffCompletedCount === 5 && (
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('planning')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'planning'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>4.4 Project Planning & WBS</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>4.5 Project Tasks ({architecturalTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coordination')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'coordination'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>4.6 Coordination Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>4.7 Progress & Site Logs</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE LAYOUT (2 Columns: Left Project List, Right Tab Content)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Projects Selector (4.1 My Assigned Projects) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Assigned Projects ({projects.length})
            </h3>
            <span className="text-[10px] text-sky-800 font-bold">Auto-Synced</span>
          </div>

          <div className="space-y-2.5">
            {projects.map((p) => {
              const isSelected = selectedProject?.id === p.id;
              const progressVal = Math.round(p.weightedProgressPercent ?? p.overallVerifiedProgress ?? 0);
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`p-4 rounded-2xl border cursor-pointer transition text-xs space-y-2.5 ${
                    isSelected
                      ? 'bg-sky-50/90 border-blue-600 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:border-sky-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 text-xs">
                      {p.workOrderNumber || p.requestCode || p.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                      {p.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{p.propertyAddress || p.city}</span>
                    </p>
                  </div>

                  <div className="pt-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-bold text-sky-900">{progressVal}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tab View Contents (4.2 - 4.7) */}
        <div className="lg:col-span-3">
          {selectedProject ? (
            <div className="space-y-6">
              {/* =================================================================
                  TAB 1: 4.1 & 4.2 PROJECT OVERVIEW
              ================================================================= */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Hero Project Banner */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                            {selectedProject.workOrderNumber || selectedProject.id}
                          </span>
                          <h2 className="text-lg sm:text-xl font-bold font-display text-navy-950">
                            {selectedProject.name}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedProject.propertyAddress}</span>
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                        <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Contract Value</span>
                        <span className="text-xl font-black text-blue-900 font-mono">
                          {formatINR(selectedProject.contractValuePaise || selectedProject.totalContractPaise || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Client Contact</span>
                        <span className="font-bold text-slate-900 block truncate mt-0.5">{selectedProject.customerName}</span>
                        <span className="text-[11px] text-slate-500">{selectedProject.customerPhone}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Plot & Built-up</span>
                        <span className="font-bold text-slate-900 block mt-0.5">
                          {(selectedProject as any).plotAreaSqFt || 2400} sq.ft Plot
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {(selectedProject as any).builtUpAreaSqFt || 4200} sq.ft Built-up
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Project Schedule</span>
                        <span className="font-bold text-slate-900 block mt-0.5">
                          Start: {formatDate(selectedProject.plannedStartDate || (selectedProject as any).startDate)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          End: {formatDate(selectedProject.plannedEndDate || (selectedProject as any).targetCompletionDate)}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Design Authority</span>
                        <span className="font-bold text-slate-900 block truncate mt-0.5">
                          {selectedProject.contractorFirm || 'Apex Architectural Studio'}
                        </span>
                        <span className="text-[11px] text-blue-900 font-bold">COA Verified Lead</span>
                      </div>
                    </div>

                    {/* Architectural Stages Pipeline */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                          Architectural Deliverable Milestones
                        </h4>
                        <span className="text-xs text-sky-800 font-bold">
                          {selectedProject.stages.filter((s) => s.status === 'COMPLETED').length} of {selectedProject.stages.length} Completed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                        {selectedProject.stages.map((stg, idx) => {
                          const isDone = stg.status === 'COMPLETED';
                          const isInProgress = stg.status === 'IN_PROGRESS';
                          return (
                            <div
                              key={stg.id || idx}
                              className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                                isDone
                                  ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                                  : isInProgress
                                  ? 'bg-sky-50/80 border-sky-300 text-sky-950 ring-1 ring-sky-300'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-black text-[11px]">M{idx + 1}</span>
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-900" />
                                ) : isInProgress ? (
                                  <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                                )}
                              </div>
                              <div className="font-bold text-[11px] line-clamp-1">{stg.name.split(':')[1] || stg.name}</div>
                              <div className="text-[10px] text-slate-500">Weight: {stg.weightPercent}%</div>
                              <div className="font-mono font-bold text-[10px] text-slate-700">
                                {stg.reportedProgress || stg.verifiedProgress || 0}% Complete
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 2: 4.3 PROJECT KICKOFF
              ================================================================= */}
              {activeTab === 'kickoff' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xs">
                          4.3
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          Project Kickoff & Site Initiation Protocol
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Ensure essential legal, financial, and topographical prerequisites are locked prior to executing full architectural schematics.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Kickoff Status</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        kickoffCompletedCount === 5 ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {kickoffCompletedCount === 5 ? 'COMPLETED & VERIFIED' : `${kickoffCompletedCount} of 5 Signed-off`}
                      </span>
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-3">
                    <div
                      onClick={() => handleToggleKickoffItem('advancePaid')}
                      className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
                          currentKickoff.advancePaid ? 'bg-blue-900 text-white' : 'border border-slate-300'
                        }`}>
                          {currentKickoff.advancePaid && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            1. Retainer / Engagement Advance Payment Verified
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Client has deposited the initial 20% mobilization advance ({formatINR(currentKickoff.advanceRequiredPaise || 4800000)}) into platform escrow.
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-900 shrink-0">Escrow Locked</span>
                    </div>

                    <div
                      onClick={() => handleToggleKickoffItem('siteDemarcationReady')}
                      className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
                          currentKickoff.siteDemarcationReady ? 'bg-blue-900 text-white' : 'border border-slate-300'
                        }`}>
                          {currentKickoff.siteDemarcationReady && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            2. Physical Site Demarcation & Boundary Survey
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Plot corners pegged with auto-level datum benchmarks. Road widths and neighboring wall offsets confirmed.
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-900 shrink-0">Field Checked</span>
                    </div>

                    <div
                      onClick={() => handleToggleKickoffItem('sanctionReceived')}
                      className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
                          currentKickoff.sanctionReceived ? 'bg-blue-900 text-white' : 'border border-slate-300'
                        }`}>
                          {currentKickoff.sanctionReceived && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            3. Municipal / Panchayat Zoning Bylaws Identified
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ground coverage percentage, maximum permissible FAR/FSI, front/rear setback dimensions, and height limits verified.
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-900 shrink-0">Bylaws Mapped</span>
                    </div>

                    <div
                      onClick={() => handleToggleKickoffItem('utilityConnectionReady')}
                      className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
                          currentKickoff.utilityConnectionReady ? 'bg-blue-900 text-white' : 'border border-slate-300'
                        }`}>
                          {currentKickoff.utilityConnectionReady && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            4. Structural Engineer & IS 456 Vetting Consultant Assigned
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Structural consultant briefed with seismic zone III criteria, soil bearing capacity (SBC) inputs, and column grid guidelines.
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-900 shrink-0">IS 456 Consultant</span>
                    </div>

                    <div
                      onClick={() => handleToggleKickoffItem('contractAgreed')}
                      className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
                          currentKickoff.contractAgreed ? 'bg-blue-900 text-white' : 'border border-slate-300'
                        }`}>
                          {currentKickoff.contractAgreed && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            5. Formal Client Kickoff Alignment Meeting Completed
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Homeowner walked through project milestones, revision policies, deliverable schedule, and signed off initial scope.
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-900 shrink-0">Client Agreed</span>
                    </div>
                  </div>

                  {/* Special Client Directives / Vastu Notes */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] font-mono">
                      Special Client Directives & Vastu Brief
                    </span>
                    <p className="text-slate-600 leading-relaxed font-sans">
                      {currentKickoff.specialInstructions || 'No custom directives specified.'}
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 3: 4.4 PROJECT PLANNING & SCHEDULE (WBS)
              ================================================================= */}
              {activeTab === 'planning' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xs">
                          4.4
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          Work Breakdown Structure (WBS) & Architectural Schedule
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Timeline dependencies, deliverable formats, weight percentages, and critical paths.
                      </p>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Print Schedule</span>
                    </button>
                  </div>

                  {/* Schedule Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                        <tr>
                          <th className="py-3 px-4 font-bold">Stage / Deliverable</th>
                          <th className="py-3 px-4 font-bold">Weight</th>
                          <th className="py-3 px-4 font-bold">Planned Dates</th>
                          <th className="py-3 px-4 font-bold">Progress</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {selectedProject.stages.map((stg, idx) => (
                          <tr key={stg.id || idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{stg.name}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{stg.description}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                              {stg.weightPercent}%
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {formatDate(stg.plannedStartDate)} &rarr; {formatDate(stg.plannedEndDate)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${stg.reportedProgress || stg.verifiedProgress || 0}%` }}
                                />
                              </div>
                              <span className="font-mono text-[10px] text-slate-500 mt-1 block">
                                {stg.reportedProgress || stg.verifiedProgress || 0}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                stg.status === 'COMPLETED'
                                  ? 'bg-blue-100 text-blue-900'
                                  : stg.status === 'IN_PROGRESS'
                                  ? 'bg-sky-100 text-sky-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {stg.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleOpenUpdate(selectedProject, idx)}
                                className="px-2.5 py-1 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Update %
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 4: 4.5 PROJECT TASKS
              ================================================================= */}
              {activeTab === 'tasks' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xs">
                          4.5
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          Architectural Execution Tasks & Checklist
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Track granular drafting, 3D render iterations, and IS 456 engineering tasks.
                      </p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {(['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'] as const).map((filterOpt) => (
                        <button
                          key={filterOpt}
                          onClick={() => setTaskFilterStatus(filterOpt)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                            taskFilterStatus === filterOpt
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {filterOpt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No tasks match the selected filter.
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const isDone = task.status === 'COMPLETED';
                        return (
                          <div
                            key={task.id}
                            className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                              isDone
                                ? 'bg-slate-50/70 border-slate-200 opacity-80'
                                : 'bg-white border-slate-200 hover:border-sky-300 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleTask(task)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 cursor-pointer transition ${
                                  isDone ? 'bg-blue-900 text-white' : 'border border-slate-300 hover:border-sky-500'
                                }`}
                              >
                                {isDone && <Check className="w-3.5 h-3.5" />}
                              </button>

                              <div>
                                <h4 className={`text-xs sm:text-sm font-bold ${
                                  isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}>
                                  {task.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                                    {task.stageName}
                                  </span>
                                  <span className="flex items-center gap-1 font-bold text-slate-700">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    <span>{task.assignee}</span>
                                  </span>
                                  <span className="flex items-center gap-1 font-mono text-slate-500">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>Due: {formatDate(task.dueDate)}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                task.priority === 'URGENT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 5: 4.6 PROJECT COORDINATION MATRIX
              ================================================================= */}
              {activeTab === 'coordination' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xs">
                          4.6
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          Multi-Stakeholder Project Coordination Matrix
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Cross-panel collaboration between Client, Architect, Contractor, and Structural Engineers.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowMeetingModal(true)}
                      className="btn-gold text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>Schedule Joint Meeting</span>
                    </button>
                  </div>

                  {/* Stakeholders Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-900 uppercase">
                          Homeowner / Client
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">Approval Authority</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{selectedProject.customerName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedProject.customerPhone}</p>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        Responsible for layout sign-offs, elevation aesthetic preference, and milestone escrow approvals.
                      </p>
                    </div>

                    {/* Lead Architect */}
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-900 uppercase">
                          Principal Architect (You)
                        </span>
                        <span className="text-[11px] font-mono text-blue-900 font-bold">Design Authority</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {selectedProject.contractorFirm || 'Apex Architectural Studio'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">Council of Architecture (COA) Registered</p>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        Sole custodian of architectural drawings, 2D/3D elevations, spatial flow, and municipal compliance.
                      </p>
                    </div>

                    {/* Structural Consultant */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-900 uppercase">
                          IS 456 Structural Consultant
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">Engineering Vetting</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Er. Anil Sharma, M.Tech Structures</h4>
                        <p className="text-xs text-slate-500 mt-0.5">+91 94250 88123 | Chartered Structural Engineer</p>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        Provides foundation design, load calculations, ductile detailing for seismic resistance, and steel BBS.
                      </p>
                    </div>

                    {/* Contractor */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 uppercase">
                          Lead Civil Contractor
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">Site Execution</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Rajesh Construction Works</h4>
                        <p className="text-xs text-slate-500 mt-0.5">+91 98260 45678 | A-Class Civil Contractor</p>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        Executes site works strictly per architect working drawings and structural column/beam details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 6: 4.7 PROJECT PROGRESS & SITE LOGS
              ================================================================= */}
              {activeTab === 'progress' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xs">
                          4.7
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          Weighted Progress Tracking & Daily Site Logs
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Track IS 456 weighted percentage completion and inspect field progress observations.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenUpdate(selectedProject, 2)}
                      className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Update Progress %</span>
                    </button>
                  </div>

                  {/* Daily Reports Feed */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                      Site Observation & Inspection Logs ({selectedProject.dailyReports?.length || 0})
                    </h4>

                    {(selectedProject.dailyReports?.length || 0) === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                        No site observation reports submitted yet. Use "Update Progress %" to record your site inspection notes.
                      </div>
                    ) : (
                      selectedProject.dailyReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{report.submittedBy}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                                {report.weather}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                              {formatDate(report.reportDate || report.submittedAt)}
                            </span>
                          </div>

                          <p className="text-slate-700 leading-relaxed">{report.workPerformed}</p>

                          {report.blockers && report.blockers !== 'None' && (
                            <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5 font-sans">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Blockers: {report.blockers}</span>
                            </div>
                          )}

                          {report.nextPlannedActivities && (
                            <div className="text-[11px] text-slate-500 italic">
                              Next: {report.nextPlannedActivities}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-3">
              <Building className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Project Selected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select an active project from the left sidebar to manage its architectural milestones, kickoff checklist, and tasks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: UPDATE PROGRESS (4.7)
      ========================================================================= */}
      {showUpdateModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Update Stage Progress: {selectedProject.stages[selectedStageIndex]?.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedProject.workOrderNumber || selectedProject.id}
                </p>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-700 font-bold">Stage Completion (0 - 100%)</label>
                  <span className="font-mono font-black text-sky-900 text-base">{newProgressPercent}%</span>
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
                <label className="block text-slate-700 font-bold mb-1">Architectural Observations & Notes</label>
                <textarea
                  rows={2}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="e.g. 3D render revision completed with contemporary louvers and evening lighting."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Issues or Delays (Optional)</label>
                <input
                  type="text"
                  value={issuesEncountered}
                  onChange={(e) => setIssuesEncountered(e.target.value)}
                  placeholder="e.g. Waiting on client color palette confirmation."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Next Planned Activity</label>
                <input
                  type="text"
                  value={nextActivity}
                  onChange={(e) => setNextActivity(e.target.value)}
                  placeholder="e.g. Release structural drawing package for municipal vetting."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 leading-relaxed">
                Saving will update the IS 456 weighted progress engine and synchronize with Customer & Admin dashboards in real-time.
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ADD NEW TASK (4.5)
      ========================================================================= */}
      {showAddTaskModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Architectural Task</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedProject.workOrderNumber || selectedProject.id}
                </p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Vastu verification of staircase & lift core"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Linked Milestone Stage</label>
                <select
                  value={newTaskStage}
                  onChange={(e) => setNewTaskStage(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  {selectedProject.stages.map((stg) => (
                    <option key={stg.id} value={stg.name}>
                      {stg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="Lead Architect">Lead Architect</option>
                    <option value="3D Visualizer">3D Visualizer</option>
                    <option value="Structural Engineer">Structural Engineer</option>
                    <option value="MEP Consultant">MEP Consultant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: SCHEDULE JOINT REVIEW MEETING (4.6)
      ========================================================================= */}
      {showMeetingModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Schedule Joint Stakeholder Review</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedProject.workOrderNumber || selectedProject.id}
                </p>
              </div>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleMeeting} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Meeting Agenda / Subject *</label>
                <input
                  type="text"
                  required
                  value={meetingSubject}
                  onChange={(e) => setMeetingSubject(e.target.value)}
                  placeholder="e.g. 3D Facade approval & Structural column placement sign-off"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Time</label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Invited Attendees</label>
                <input
                  type="text"
                  value={meetingAttendees}
                  onChange={(e) => setMeetingAttendees(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900">
                A calendar invitation with Google Meet / On-Site coordinates will be broadcast to the Client, Structural Engineer, and Contractor.
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Send Invitations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
