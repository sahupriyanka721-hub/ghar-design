import { BuildGharLoader } from '../../components/common/BuildGharLoader.js';
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getPlatformRequests, PlatformProjectRequest } from '../../data/customerStore.js';
import {
  getProjectTimeline,
  updateMilestoneProgress,
  DEFAULT_STAGES_BLUEPRINT,
  ProjectTimeline,
  ProjectMilestone,
  ProjectTimelineLog,
} from '../../data/projectTimelineStore.js';
import {
  Hammer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Camera,
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  PlusCircle,
  Edit3,
  Sliders,
  Printer,
  History,
  Check,
  X,
  Upload,
  Percent,
  TrendingUp,
  MapPin,
  Building2,
  HardHat,
} from 'lucide-react';

export const TrackService: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [timeline, setTimeline] = useState<ProjectTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Milestone for Detail View
  const [activeStageNumber, setActiveStageNumber] = useState<number>(1);

  // Update Milestone Progress Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [modalStageNumber, setModalStageNumber] = useState<number>(1);
  const [updatePercent, setUpdatePercent] = useState<number>(50);
  const [updateStatus, setUpdateStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'>('IN_PROGRESS');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [updaterName, setUpdaterName] = useState<string>('');
  const [updaterRole, setUpdaterRole] = useState<'PROFESSIONAL' | 'ADMIN' | 'CUSTOMER'>('PROFESSIONAL');
  const [sitePhotoUrl, setSitePhotoUrl] = useState<string>('');

  // Chat message state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');

  // 1. Load Requests and Timeline (Zero Dummy Data - Only Genuine Customer Requests)
  const loadProjectData = () => {
    // Clean up any legacy dummy project data from localStorage
    try {
      localStorage.removeItem('gd_project_timeline_PROJ-DEFAULT-2026');
      localStorage.removeItem('project_messages_PROJ-DEFAULT-2026');
    } catch (e) {}

    const allRequests = getPlatformRequests();
    const userPhoneDigits = user?.phone?.replace(/\D/g, '').slice(-10);

    const userRequests = allRequests.filter((r) => {
      const rPhoneDigits = r.customerPhone?.replace(/\D/g, '').slice(-10);
      if (user?.role === 'ADMIN') return true;
      if (user?.role === 'PROFESSIONAL') {
        return r.assignedProfessionalIds?.includes(user?.id || '') || r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED';
      }
      return (
        (user?.id && r.customerId === user.id) ||
        (userPhoneDigits && rPhoneDigits === userPhoneDigits)
      );
    });

    setRequests(userRequests);

    const currentReq = userRequests.find((r) => r.id === selectedRequestId) || userRequests[0];
    if (currentReq) {
      setSelectedRequestId(currentReq.id);
      const tl = getProjectTimeline(currentReq.id, {
        projectCode: currentReq.requestCode,
        projectTitle: currentReq.description?.slice(0, 60) || `${currentReq.propertyType || 'Civil'} Construction Project`,
        customerName: currentReq.customerName || user?.name || 'Customer',
        customerPhone: currentReq.customerPhone || user?.phone || '',
        city: currentReq.city || user?.city || '',
        locality: currentReq.locality || currentReq.address || '',
        builtUpAreaSqFt: currentReq.builtUpArea || currentReq.plotArea || 0,
        assignedProfessionalName: currentReq.assignedProfessionalName,
      });
      setTimeline(tl);

      // Set active stage to the first In-Progress or Pending stage
      const currentActive = tl.milestones.find((m) => m.status === 'IN_PROGRESS') || tl.milestones[0];
      if (currentActive) {
        setActiveStageNumber(currentActive.stageNumber);
      }

      // Load chat messages
      const savedMsgs = localStorage.getItem(`project_messages_${currentReq.id}`);
      if (savedMsgs) {
        try {
          setMessages(JSON.parse(savedMsgs));
        } catch (e) {
          setMessages([]);
        }
      }
    } else {
      // ZERO DUMMY DATA: If user has no active construction requests, do not display fake projects
      setTimeline(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjectData();
    window.addEventListener('storage', loadProjectData);
    return () => window.removeEventListener('storage', loadProjectData);
  }, [user, selectedRequestId]);

  // Open Update Modal with preloaded data
  const handleOpenUpdateModal = (stageNum: number) => {
    if (!timeline) return;
    const stage = timeline.milestones.find((m) => m.stageNumber === stageNum);
    if (stage) {
      setModalStageNumber(stageNum);
      setUpdatePercent(stage.completionPercent);
      setUpdateStatus(stage.status);
      setUpdateNotes(stage.notes || '');
      setUpdaterName(user?.name || (user?.role === 'PROFESSIONAL' ? 'Site Project Engineer' : 'Homeowner'));
      setUpdaterRole(user?.role === 'ADMIN' ? 'ADMIN' : user?.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'CUSTOMER');
      setSitePhotoUrl(stage.sitePhotoUrl || '');
      setShowUpdateModal(true);
    }
  };

  // Submit Milestone Progress Update
  const handleSubmitProgressUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeline) return;

    try {
      const updatedTl = updateMilestoneProgress(timeline.projectId, modalStageNumber, {
        completionPercent: Number(updatePercent),
        status: updateStatus,
        notes: updateNotes.trim(),
        sitePhotoUrl: sitePhotoUrl.trim() || undefined,
        updatedBy: updaterName.trim() || 'Site Supervisor',
        updatedByRole: updaterRole,
      });

      setTimeline(updatedTl);
      setShowUpdateModal(false);
      setActiveStageNumber(modalStageNumber);
      success(`Stage ${modalStageNumber} updated to ${updatePercent}% (${updateStatus.replace('_', ' ')})! Overall progress is now ${updatedTl.totalProgressPercent}%.`);
    } catch (err: any) {
      error(err.message || 'Failed to update milestone progress');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !timeline) return;

    const newEntry = {
      id: `pmsg-${Date.now()}`,
      senderName: user?.name || 'Homeowner',
      senderRole: user?.role || 'CUSTOMER',
      content: newMsg.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, newEntry];
    setMessages(updated);
    localStorage.setItem(`project_messages_${timeline.projectId}`, JSON.stringify(updated));
    setNewMsg('');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="card p-16 flex items-center justify-center">
        <BuildGharLoader message="Loading Real Engineering Timeline & Progress Data..." />
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="space-y-6 font-sans">
        {/* Zero Dummy Data: Clean Empty State */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 text-amber-600">
            <HardHat className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 mb-2">
            No Active Construction Project Found
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Aapka live 10-stage construction milestone tracker tab shuru hoga jab aap apna naya ghar, renovation ya engineering drawing project request submit karenge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard/create-request"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
            >
              Start New Construction Request
            </Link>
            <Link
              to="/services"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Explore Engineering Services
            </Link>
          </div>
        </div>

        {/* Informative Preview of 10-Stage CPWD & IS 456 Framework */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-4">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              Engineering Workflow Preview
            </span>
            <h3 className="text-base font-black text-slate-900 font-display mt-0.5">
              10-Stage Civil Milestone Tracking Standards (IS 456 & CPWD)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Jab aapka project start hoga, har stage par site engineer inspection notes aur live photos upload ki jayengi:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEFAULT_STAGES_BLUEPRINT.map((stage) => (
              <div
                key={stage.stageNumber}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-3 text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  {stage.stageNumber}
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{stage.name}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                      {stage.weightagePercent}% Weight
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeMilestone = timeline.milestones.find((m) => m.stageNumber === activeStageNumber) || timeline.milestones[0];

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <HardHat className="w-4 h-4" />
            <span>Site Execution Timeline & Milestone Tracker</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">
            {timeline.projectTitle}
          </h1>
          <p className="text-slate-500 text-xs mt-1 flex flex-wrap items-center gap-2">
            <span>Project Code: <strong className="text-navy-950 font-mono">{timeline.projectCode}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {timeline.locality}, {timeline.city}
            </span>
            <span>•</span>
            <span>Client: <strong className="text-slate-800">{timeline.customerName}</strong></span>
          </p>

          {requests.length > 1 && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Switch Project:</span>
              <select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              >
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestCode || r.id} - {r.description?.slice(0, 35) || r.categorySlug}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Main Call to Action: Update Milestone Progress */}
          <button
            onClick={() => handleOpenUpdateModal(activeStageNumber)}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            <span>Update Stage Progress</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            title="Print Official Progress Certificate"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Overall Progress Overview Gauge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Weighted Construction Progress
            </span>
            <div className="text-lg font-black text-slate-900 font-display mt-0.5 flex items-center gap-2">
              <span>Stage {activeMilestone.stageNumber} of 10: {activeMilestone.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                activeMilestone.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : activeMilestone.status === 'IN_PROGRESS'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {activeMilestone.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-3xl font-display font-black text-amber-600">
              {timeline.totalProgressPercent}%
            </div>
            <span className="text-slate-500 text-xs font-semibold">Overall Site Completion</span>
          </div>
        </div>

        {/* Master Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${timeline.totalProgressPercent}%` }}
          />
        </div>

        {/* Quick Project Metas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Engineer</span>
            <div className="font-bold text-slate-900 mt-0.5">{timeline.assignedProfessionalName}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Built-Up Area</span>
            <div className="font-bold text-slate-900 mt-0.5">{timeline.builtUpAreaSqFt?.toLocaleString('en-IN')} Sq.Ft</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Last Progress Update</span>
            <div className="font-bold text-slate-900 mt-0.5">
              {new Date(timeline.lastUpdatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Standards Complied</span>
            <div className="font-bold text-emerald-700 mt-0.5">IS 456 & CPWD Vetted</div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: 10 Milestone Stepper (Left) & Active Stage Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Cols: Complete 10 Milestone Stepper */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>10-Stage Milestone Execution Timeline</span>
            </h2>
            <span className="text-xs text-slate-500">Click any stage to view details</span>
          </div>

          <div className="space-y-2.5">
            {(timeline.milestones || []).map((m) => {
              const isSelected = m.stageNumber === activeStageNumber;
              const isComplete = m.completionPercent === 100 || m.status === 'COMPLETED';
              const isInProgress = m.status === 'IN_PROGRESS';

              return (
                <div
                  key={m.stageNumber}
                  onClick={() => setActiveStageNumber(m.stageNumber)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/50 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Stage Circle Number */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isComplete
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isInProgress
                            ? 'bg-amber-500 text-slate-950 font-black ring-4 ring-amber-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isComplete ? <Check className="w-4 h-4" /> : m.stageNumber}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {m.name}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {m.weightagePercent}% Weight
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
                          {m.description}
                        </p>
                      </div>
                    </div>

                    {/* Stage Progress Pill & Update Action */}
                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-sm font-black font-display text-slate-900">
                        {m.completionPercent}%
                      </div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isComplete
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Stage Individual Mini Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${m.completionPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Active Milestone Detail + Site Logs & Chat */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Stage Inspection Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Selected Milestone Detail
                </span>
                <h3 className="font-black text-base text-slate-900 font-display">
                  Stage {activeMilestone.stageNumber}: {activeMilestone.name}
                </h3>
              </div>

              <button
                onClick={() => handleOpenUpdateModal(activeMilestone.stageNumber)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>Update This Stage</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Technical Scope</span>
                <p className="text-slate-700 leading-relaxed mt-0.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {activeMilestone.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Current Completion</span>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {activeMilestone.completionPercent}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Milestone Weightage</span>
                  <div className="text-base font-black text-amber-600 mt-0.5">
                    {activeMilestone.weightagePercent}% of Project
                  </div>
                </div>
              </div>

              {activeMilestone.notes && (
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Site Engineer Inspection Notes</span>
                  <p className="text-slate-800 bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl mt-0.5 leading-relaxed font-medium">
                    "{activeMilestone.notes}"
                  </p>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Logged by: <strong>{activeMilestone.lastUpdatedBy}</strong></span>
                    <span>{new Date(activeMilestone.lastUpdatedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real Chronological Audit Trail & Activity Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <span>Site Work Activity Log ({timeline.logs.length})</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Audit Trail
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(timeline.logs || []).map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {log.notes}
                    </p>
                  )}
                  <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-200/50">
                    <span>Updated by: <strong className="text-slate-700">{log.updatedBy}</strong> ({log.updatedByRole})</span>
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Chat & Coordination */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Contractor & Site Team Direct Chat</span>
            </h3>

            <div className="bg-slate-50 p-3 rounded-xl max-h-48 overflow-y-auto space-y-2 border border-slate-100 text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[11px]">
                  No messages yet. Send a query to your lead contractor.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl max-w-[85%] ${
                      m.senderRole === 'CUSTOMER'
                        ? 'bg-amber-100 text-slate-900 ml-auto'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-500 mb-0.5">{m.senderName}</div>
                    <div>{m.content}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Ask contractor or site engineer..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. UPDATE STAGE PROGRESS MODAL ("Kitna Kaam Hua Ye Update Karein") */}
      {/* ========================================================================= */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black font-display text-white">
                    Update Site Progress / Milestone
                  </h2>
                  <p className="text-xs text-slate-400">
                    Record genuine construction work completion & inspection notes
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUpdateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProgressUpdate} className="p-6 space-y-4 text-xs text-slate-700">
              {/* Select Stage */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Select Construction Milestone</label>
                <select
                  value={modalStageNumber}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    setModalStageNumber(num);
                    const found = timeline.milestones.find((m) => m.stageNumber === num);
                    if (found) {
                      setUpdatePercent(found.completionPercent);
                      setUpdateStatus(found.status);
                      setUpdateNotes(found.notes || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {(timeline.milestones || []).map((m) => (
                    <option key={m.stageNumber} value={m.stageNumber}>
                      Stage {m.stageNumber}: {m.name} ({m.weightagePercent}% Weightage)
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress Percentage Slider & Number */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span>Work Completion Percentage:</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={updatePercent}
                      onChange={(e) => setUpdatePercent(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-sm font-black text-slate-900 text-center"
                    />
                    <span className="font-black text-slate-700">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={updatePercent}
                  onChange={(e) => setUpdatePercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>0% (Not Started)</span>
                  <span>50% (Half Done)</span>
                  <span>100% (Completed)</span>
                </div>
              </div>

              {/* Milestone Status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Milestone Stage Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'PENDING', label: 'Pending' },
                    { id: 'IN_PROGRESS', label: 'In Progress' },
                    { id: 'COMPLETED', label: 'Completed' },
                    { id: 'BLOCKED', label: 'Hold / Blocked' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setUpdateStatus(st.id as any);
                        if (st.id === 'COMPLETED') setUpdatePercent(100);
                        if (st.id === 'PENDING') setUpdatePercent(0);
                      }}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition ${
                        updateStatus === st.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Updater Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Updated By (Name)</label>
                  <input
                    type="text"
                    required
                    value={updaterName}
                    onChange={(e) => setUpdaterName(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Updater Role</label>
                  <select
                    value={updaterRole}
                    onChange={(e) => setUpdaterRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  >
                    <option value="PROFESSIONAL">Site Engineer / Contractor</option>
                    <option value="ADMIN">Super Admin / PMC Auditor</option>
                    <option value="CUSTOMER">Client / Homeowner</option>
                  </select>
                </div>
              </div>

              {/* Site Notes / Report */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  Site Inspection Notes & Work Accomplished
                </label>
                <textarea
                  rows={3}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-black rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Progress Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
