import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Image as ImageIcon,
  CheckSquare,
  Sliders,
  Filter,
  X,
  Sparkles,
  Share2,
  FileText,
  Send,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Layers,
  MessageSquare,
  Check,
  Search,
  RotateCcw,
  Maximize2,
  Download,
  CalendarRange,
  Ruler,
  Compass,
  Building2,
  Upload,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  getInteriorSiteVisits,
  saveInteriorSiteVisit,
  requestSiteVisitRescheduleThroughAdmin,
  submitSiteVisitReportToAdmin,
  getSiteVisitReports,
  getInteriorSnagItems,
  saveInteriorSnagItem,
  resolveInteriorSnagItem,
  getInteriorCoordinationRequests,
  createCoordinationRequestViaAdmin,
  getInteriorProjects,
  InteriorSiteVisit,
  InteriorSiteVisitReport,
  InteriorSnagItem,
  InteriorCoordinationRequest,
  CoordinationDiscipline,
  CoordinationType,
} from '../../data/interiorDesignerStore.js';
import { useToast } from '../../context/ToastContext.js';

export type SiteVisitViewMode =
  | 'NEW_REQUESTS'
  | 'UPCOMING_VISITS'
  | 'VISIT_CALENDAR'
  | 'SITE_MEASUREMENTS'
  | 'VISIT_REPORTS'
  | 'SITE_PHOTOS'
  | 'COMPLETED_VISITS';

interface LaserMeasurementRecord {
  id: string;
  projectId: string;
  roomName: string;
  lengthFt: string;
  widthFt: string;
  heightFt: string;
  beamDropMm: string;
  notes: string;
  recordedAt: string;
}

interface SitePhotoItem {
  id: string;
  projectId: string;
  url: string;
  roomName: string;
  caption: string;
  uploadedAt: string;
}

export const InteriorDesignerSiteManagement: React.FC = () => {
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');
  const [searchQuery, setSearchQuery] = useState('');

  const [siteVisits, setSiteVisits] = useState<InteriorSiteVisit[]>(() =>
    getInteriorSiteVisits(selectedProjectId)
  );
  const [siteReports, setSiteReports] = useState<InteriorSiteVisitReport[]>(() =>
    getSiteVisitReports(selectedProjectId)
  );

  // Laser Measurements state
  const [measurements, setMeasurements] = useState<LaserMeasurementRecord[]>([
    { id: 'm-1', projectId: 'prj-int-1', roomName: 'Living & Dining Room', lengthFt: '26.4 ft', widthFt: '18.2 ft', heightFt: '10.5 ft', beamDropMm: '150 mm', notes: 'Laser verification passed. North wall clear for Statuario marble dry lay.', recordedAt: '2026-11-10' },
    { id: 'm-2', projectId: 'prj-int-1', roomName: 'Modular Kitchen', lengthFt: '16.0 ft', widthFt: '12.2 ft', heightFt: '10.5 ft', beamDropMm: '120 mm', notes: 'Plumbing inlet at 450mm from floor. Exhaust shaft cut-out verified.', recordedAt: '2026-11-10' },
    { id: 'm-3', projectId: 'prj-int-1', roomName: 'Master Bedroom Suite', lengthFt: '20.1 ft', widthFt: '16.3 ft', heightFt: '10.5 ft', beamDropMm: '100 mm', notes: 'Walk-in wardrobe recess length 14 ft. Sconce conduit boxes verified.', recordedAt: '2026-11-10' },
    { id: 'm-4', projectId: 'prj-int-2', roomName: 'Scandinavian Living Room', lengthFt: '22.0 ft', widthFt: '15.5 ft', heightFt: '10.0 ft', beamDropMm: '100 mm', notes: 'False ceiling cove light perimeter depth measured at 200mm.', recordedAt: '2026-11-12' },
  ]);

  // Site Photos state
  const [sitePhotos, setSitePhotos] = useState<SitePhotoItem[]>([
    { id: 'sp-1', projectId: 'prj-int-1', url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1200', roomName: 'Modular Kitchen', caption: 'Plywood carcass framing and Blum tandembox runner level check', uploadedAt: '2026-11-20' },
    { id: 'sp-2', projectId: 'prj-int-1', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200', roomName: 'Living Room', caption: 'Gyproc false ceiling perimeter channel alignment and cove light inspection', uploadedAt: '2026-11-22' },
    { id: 'sp-3', projectId: 'prj-int-1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', roomName: 'Living Room', caption: 'Statuario Italian marble dry lay and bookmatch inspection with PMC engineer', uploadedAt: '2026-11-24' },
    { id: 'sp-4', projectId: 'prj-int-2', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=1200', roomName: 'Master Bedroom', caption: 'Acoustic fluted oak headboard battens marking and conduit rough-in', uploadedAt: '2026-11-18' },
  ]);

  // Modals
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<InteriorSiteVisit | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedVisitForReport, setSelectedVisitForReport] = useState<InteriorSiteVisit | null>(null);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // New Visit Form
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTimeSlot, setVisitTimeSlot] = useState('11:00 AM - 01:00 PM');
  const [visitLocation, setVisitLocation] = useState('');

  // Reschedule Form
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Site Visit Report Form (Section 11)
  const [reportRoomMeasurements, setReportRoomMeasurements] = useState('');
  const [reportExistingCondition, setReportExistingCondition] = useState('');
  const [reportRecommendations, setReportRecommendations] = useState('');
  const [reportIssuesFound, setReportIssuesFound] = useState('');
  const [reportRequiredMaterials, setReportRequiredMaterials] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  // New Measurement Form
  const [newMeasRoom, setNewMeasRoom] = useState('Living Room');
  const [newMeasL, setNewMeasL] = useState('24.0 ft');
  const [newMeasW, setNewMeasW] = useState('16.0 ft');
  const [newMeasH, setNewMeasH] = useState('10.5 ft');
  const [newMeasDrop, setNewMeasDrop] = useState('150 mm');
  const [newMeasNotes, setNewMeasNotes] = useState('');

  // New Photo Form
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoRoom, setNewPhotoRoom] = useState('Living Room');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  const loadData = () => {
    setSiteVisits(getInteriorSiteVisits(selectedProjectId));
    setSiteReports(getSiteVisitReports(selectedProjectId));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('interior_visits_updated', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('interior_visits_updated', loadData);
    };
  }, [selectedProjectId]);

  // Current view from URL query param
  const currentView: SiteVisitViewMode =
    (searchParams.get('view') as SiteVisitViewMode) || 'NEW_REQUESTS';

  const handleSetView = (view: SiteVisitViewMode) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    setSearchParams(params);
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Filtered lists for sub-views
  const allVisits = siteVisits;
  const newRequests = allVisits.filter((v) => v.status === 'SCHEDULED' && (!v.visitDate || v.visitDate >= new Date().toISOString().slice(0, 10)));
  const upcomingVisits = allVisits.filter((v) => v.status === 'SCHEDULED');
  const completedVisits = allVisits.filter((v) => v.status === 'COMPLETED' || v.status === 'REPORT_SUBMITTED' || v.status === 'APPROVED_BY_ADMIN');

  // Counts for 7 tabs
  const viewCounts: Record<SiteVisitViewMode, number> = {
    NEW_REQUESTS: newRequests.length,
    UPCOMING_VISITS: upcomingVisits.length,
    VISIT_CALENDAR: allVisits.length,
    SITE_MEASUREMENTS: measurements.filter((m) => selectedProjectId === 'ALL' || m.projectId === selectedProjectId).length,
    VISIT_REPORTS: siteReports.length,
    SITE_PHOTOS: sitePhotos.filter((p) => selectedProjectId === 'ALL' || p.projectId === selectedProjectId).length,
    COMPLETED_VISITS: completedVisits.length,
  };

  const SITE_VIEW_TABS: { id: SiteVisitViewMode; label: string; icon: any }[] = [
    { id: 'NEW_REQUESTS', label: '1. New Site Visit Requests', icon: Clock },
    { id: 'UPCOMING_VISITS', label: '2. Upcoming Visits', icon: Calendar },
    { id: 'VISIT_CALENDAR', label: '3. Site Visit Calendar', icon: CalendarRange },
    { id: 'SITE_MEASUREMENTS', label: '4. Site Measurements', icon: Ruler },
    { id: 'VISIT_REPORTS', label: '5. Site Visit Reports', icon: FileText },
    { id: 'SITE_PHOTOS', label: '6. Site Photos', icon: Camera },
    { id: 'COMPLETED_VISITS', label: '7. Completed Visits', icon: CheckCircle2 },
  ];

  // Actions
  const handleScheduleVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitPurpose.trim() || !visitDate) {
      error('Please specify purpose and date');
      return;
    }

    saveInteriorSiteVisit({
      projectId: selectedProjectId,
      projectName: currentProject?.title || 'Interior Project',
      scheduledDate: visitDate,
      timeSlot: visitTimeSlot,
      purpose: visitPurpose.trim(),
      siteLocation: visitLocation.trim() || currentProject?.projectAddress || 'Site Address',
      status: 'SCHEDULED',
    });

    success('Site visit scheduled successfully!');
    setIsVisitModalOpen(false);
    setVisitPurpose('');
    setVisitDate('');
    loadData();
  };

  const handleRequestReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitForReschedule) return;
    if (!rescheduleDate || !rescheduleReason.trim()) {
      error('Please specify proposed date and reason');
      return;
    }

    requestSiteVisitRescheduleThroughAdmin(
      selectedVisitForReschedule.id,
      rescheduleDate,
      rescheduleReason.trim()
    );

    success('Reschedule request sent to BuildGhar Admin for homeowner alignment!');
    setIsRescheduleModalOpen(false);
    setSelectedVisitForReschedule(null);
    setRescheduleDate('');
    setRescheduleReason('');
    loadData();
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitForReport) return;

    submitSiteVisitReportToAdmin({
      projectId: selectedProjectId,
      projectName: currentProject?.title || 'Interior Project',
      visitDate: selectedVisitForReport.scheduledDate,
      siteLocation: selectedVisitForReport.siteLocation || 'Site Address',
      roomMeasurements: reportRoomMeasurements.trim() || 'All room dimensions verified with laser measure.',
      existingSiteCondition: reportExistingCondition.trim() || 'Civil structure ready for woodcraft and false ceiling.',
      designRecommendations: reportRecommendations.trim() || 'Proceed with modular carcass framing.',
      issuesFound: reportIssuesFound.trim() || 'No major discrepancies.',
      requiredMaterials: reportRequiredMaterials.trim() || 'Greenply BWP 710 ply, Saint-Gobain Gyproc boards.',
      supportingPhotos: selectedVisitForReport.photos || [],
      additionalNotes: reportNotes.trim() || 'Inspected jointly with PMC engineer.',
    });

    success('Site Visit Report submitted to Admin for compliance verification!');
    setIsReportModalOpen(false);
    setSelectedVisitForReport(null);
    setReportRoomMeasurements('');
    setReportExistingCondition('');
    setReportRecommendations('');
    setReportIssuesFound('');
    setReportRequiredMaterials('');
    setReportNotes('');
    loadData();
  };

  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const newM: LaserMeasurementRecord = {
      id: `m-${Date.now()}`,
      projectId: selectedProjectId,
      roomName: newMeasRoom,
      lengthFt: newMeasL,
      widthFt: newMeasW,
      heightFt: newMeasH,
      beamDropMm: newMeasDrop,
      notes: newMeasNotes || 'Laser verified on site.',
      recordedAt: new Date().toISOString().slice(0, 10),
    };
    setMeasurements([newM, ...measurements]);
    success(`Laser measurement logged for ${newMeasRoom}!`);
    setIsMeasurementModalOpen(false);
    setNewMeasNotes('');
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    const newP: SitePhotoItem = {
      id: `sp-${Date.now()}`,
      projectId: selectedProjectId,
      url: newPhotoUrl.trim() || 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1200',
      roomName: newPhotoRoom,
      caption: newPhotoCaption || 'Site progress photo',
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setSitePhotos([newP, ...sitePhotos]);
    success('Site photo uploaded to project gallery!');
    setIsPhotoModalOpen(false);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* ---------------- HEADER & VIEW SELECTOR ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black uppercase font-mono mb-1.5 border border-blue-200">
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Module 7 • On-Site Supervision &amp; Inspection Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Site Visit Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Schedule visits, record physical laser measurements, upload site progress photos, and submit Admin-mediated inspection reports (Section 11).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={currentView}
              onChange={(e) => handleSetView(e.target.value as SiteVisitViewMode)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-950 shadow-2xs hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              {SITE_VIEW_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} ({viewCounts[tab.id]})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsVisitModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* ---------------- 7-PILL SUB-FEATURE ACTION STRIP ---------------- */}
      <div className="p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {SITE_VIEW_TABS.map((tab) => {
            const isActive = currentView === tab.id;
            const Icon = tab.icon;
            const count = viewCounts[tab.id];
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
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- SECTION 11 ROUTING GOVERNANCE BANNER ---------------- */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Section 11 Governance Rule:</strong> All site visit logs, laser measurements, and inspection reports must be submitted through BuildGhar Admin for customer alignment. Direct unverified site changes are strictly prohibited.
          </span>
        </div>
        <span className="font-mono font-bold bg-white text-amber-900 px-3 py-1 rounded-full border border-amber-200 shrink-0 text-[11px]">
          Admin Mediated Logs
        </span>
      </div>

      {/* ---------------- PROJECT FILTER & SEARCH BAR ---------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-bold text-slate-500 shrink-0 pl-2">Filter by Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950 focus:border-blue-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectId} - {p.title} ({p.customerName})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visits, locations, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-navy-950 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: NEW SITE VISIT REQUESTS                                           */}
      {/* ========================================================================= */}
      {currentView === 'NEW_REQUESTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">New Site Visit Requests Pending Confirmation</h3>
                <p className="text-xs text-slate-600">
                  Visits scheduled or requested by client / PMC lead. Please confirm slot availability or request reschedule through Admin.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              {newRequests.length} Requests Pending
            </span>
          </div>

          <div className="space-y-3">
            {newRequests.map((visit) => (
              <div key={visit.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 text-xs">
                      {visit.id.toUpperCase()}
                    </span>
                    <h4 className="font-extrabold text-navy-950 text-sm">{visit.purpose}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold text-[10px] uppercase">
                    {visit.status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Project</span>
                    <span className="font-bold text-navy-950">{visit.projectName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Scheduled Date &amp; Time</span>
                    <span className="font-mono font-bold text-blue-700">{visit.scheduledDate} • {visit.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Site Location</span>
                    <span className="font-medium text-slate-800 truncate block">{visit.siteLocation}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedVisitForReschedule(visit);
                      setIsRescheduleModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                  >
                    Request Reschedule
                  </button>
                  <button
                    onClick={() => {
                      saveInteriorSiteVisit({ id: visit.id, status: 'SCHEDULED' });
                      success('Site visit slot confirmed!');
                      loadData();
                    }}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Site Visit Slot</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: UPCOMING VISITS                                                   */}
      {/* ========================================================================= */}
      {currentView === 'UPCOMING_VISITS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Confirmed Upcoming Site Inspections</h3>
                <p className="text-xs text-slate-600">
                  Inspections lined up across active project locations with PMC site supervision.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              {upcomingVisits.length} Confirmed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingVisits.map((visit) => (
              <div key={visit.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {visit.scheduledDate}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                    {visit.timeSlot}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-navy-950 text-base">{visit.projectName}</h4>
                  <p className="text-xs text-slate-600 mt-1">{visit.purpose}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-slate-700 truncate">{visit.siteLocation}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      setSelectedVisitForReport(visit);
                      setIsReportModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Submit Inspection Report</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedVisitForReschedule(visit);
                      setIsRescheduleModalOpen(true);
                    }}
                    className="text-slate-500 hover:text-navy-950 font-bold"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: SITE VISIT CALENDAR                                               */}
      {/* ========================================================================= */}
      {currentView === 'VISIT_CALENDAR' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarRange className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Site Visit Schedule &amp; Inspection Calendar</h3>
                <p className="text-xs text-slate-600">
                  Weekly &amp; monthly timeline view of designer inspections and demarcation appointments.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Add Appointment
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-extrabold text-navy-950 text-base">Chronological Inspection Schedule</h4>

            <div className="space-y-3">
              {allVisits.map((v) => (
                <div key={v.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 font-black flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-mono">{v.scheduledDate.slice(5, 7)}</span>
                      <span className="text-sm font-bold leading-none">{v.scheduledDate.slice(8, 10)}</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-navy-950 text-sm">{v.projectName}</h5>
                      <span className="text-slate-600 block mt-0.5">{v.purpose}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Slot: {v.timeSlot} • {v.siteLocation}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                      v.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: SITE MEASUREMENTS                                                 */}
      {/* ========================================================================= */}
      {currentView === 'SITE_MEASUREMENTS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Physical Laser Measurement Takeoff Logs</h3>
                <p className="text-xs text-slate-600">
                  On-site room dimensions, ceiling drops, column beam recesses, and plumb verification records.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMeasurementModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log New Measurement</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-extrabold text-navy-950 text-base">Verified Room Dimension Records</h4>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3.5">Room / Zone</th>
                    <th className="py-3 px-3.5 text-right">Length</th>
                    <th className="py-3 px-3.5 text-right">Width</th>
                    <th className="py-3 px-3.5 text-right">Clear Height</th>
                    <th className="py-3 px-3.5 text-right">Beam Drop</th>
                    <th className="py-3 px-3.5">Verification Notes</th>
                    <th className="py-3 px-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {measurements
                    .filter((m) => selectedProjectId === 'ALL' || m.projectId === selectedProjectId)
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3.5 font-bold text-navy-950">{m.roomName}</td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-700">{m.lengthFt}</td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-700">{m.widthFt}</td>
                        <td className="py-3 px-3.5 text-right font-mono text-slate-700">{m.heightFt}</td>
                        <td className="py-3 px-3.5 text-right font-mono text-slate-500">{m.beamDropMm}</td>
                        <td className="py-3 px-3.5 text-slate-600">{m.notes}</td>
                        <td className="py-3 px-3.5 text-right font-mono text-slate-400">{m.recordedAt}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: SITE VISIT REPORTS                                                */}
      {/* ========================================================================= */}
      {currentView === 'VISIT_REPORTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Official Section 11 Site Visit Inspection Reports</h3>
                <p className="text-xs text-slate-600">
                  Submitted post-visit reports audited by BuildGhar Admin before release to customer dossier.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              {siteReports.length} Reports Filed
            </span>
          </div>

          <div className="space-y-3">
            {siteReports.map((report) => (
              <div key={report.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 text-xs">
                      {report.id}
                    </span>
                    <span className="text-xs font-bold text-navy-950">{report.projectName}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] uppercase">
                    {report.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Existing Site Conditions</span>
                    <p className="text-slate-700 mt-0.5">{report.existingSiteCondition}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Design Recommendations</span>
                    <p className="text-slate-700 mt-0.5">{report.designRecommendations}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Audited on: {report.visitDate} • Submitted by {report.submittedBy}</span>
                  <button
                    onClick={() => success(`Inspection report ${report.id} downloaded.`)}
                    className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: SITE PHOTOS                                                       */}
      {/* ========================================================================= */}
      {currentView === 'SITE_PHOTOS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Site Execution Progress Photo Gallery</h3>
                <p className="text-xs text-slate-600">
                  Live photographic logs documenting civil demolition, false ceiling framing, and marble installation.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Site Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sitePhotos
              .filter((p) => selectedProjectId === 'ALL' || p.projectId === selectedProjectId)
              .map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setPreviewPhoto(photo.url)}
                  className="rounded-3xl bg-white border border-slate-200 shadow-2xs overflow-hidden cursor-pointer group hover:border-blue-300 transition"
                >
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-navy-950/70 text-white">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="p-3.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 font-mono text-[11px]">{photo.roomName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{photo.uploadedAt}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2">{photo.caption}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 7: COMPLETED VISITS                                                  */}
      {/* ========================================================================= */}
      {currentView === 'COMPLETED_VISITS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Verified &amp; Completed Site Inspections</h3>
                <p className="text-xs text-slate-600">
                  Historical log of completed physical audits with homeowner sign-offs and reports filed in BuildGhar Vault.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-emerald-900 border border-emerald-200 font-mono font-bold text-xs">
              {completedVisits.length} Audits Closed
            </span>
          </div>

          <div className="space-y-3">
            {completedVisits.map((visit) => (
              <div key={visit.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                      {visit.scheduledDate}
                    </span>
                    <h4 className="font-extrabold text-navy-950 text-sm">{visit.projectName}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Inspection Completed</span>
                  </span>
                </div>

                <p className="text-xs text-slate-700">{visit.purpose}</p>

                {visit.measurementsSummary && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-600">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Measurement Summary</span>
                    {visit.measurementsSummary}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Location: {visit.siteLocation}</span>
                  <button
                    onClick={() => success('Inspection closure certificate downloaded.')}
                    className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Audit Seal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SCHEDULE NEW SITE VISIT                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isVisitModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-navy-950 text-base">Schedule Site Inspection</h3>
                </div>
                <button onClick={() => setIsVisitModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleVisit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-navy-950 block mb-1">Target Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-bold"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectId} - {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Visit Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrical Conduit Chasing & Demarcation Verification"
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Time Slot</label>
                    <select
                      value={visitTimeSlot}
                      onChange={(e) => setVisitTimeSlot(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-semibold"
                    >
                      <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                      <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                      <option value="02:30 PM - 04:30 PM">02:30 PM - 04:30 PM</option>
                      <option value="04:30 PM - 06:30 PM">04:30 PM - 06:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Site Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Tower 4, Flat 1802, DLF Phase 5"
                    value={visitLocation}
                    onChange={(e) => setVisitLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsVisitModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    Confirm &amp; Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: LOG LASER MEASUREMENT                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMeasurementModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-navy-950 text-base">Log Laser Measurement</h3>
                </div>
                <button onClick={() => setIsMeasurementModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMeasurement} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-navy-950 block mb-1">Room / Zone</label>
                  <input
                    type="text"
                    value={newMeasRoom}
                    onChange={(e) => setNewMeasRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Length (ft / in)</label>
                    <input
                      type="text"
                      value={newMeasL}
                      onChange={(e) => setNewMeasL(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Width (ft / in)</label>
                    <input
                      type="text"
                      value={newMeasW}
                      onChange={(e) => setNewMeasW(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Clear Height (ft)</label>
                    <input
                      type="text"
                      value={newMeasH}
                      onChange={(e) => setNewMeasH(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Beam Drop (mm)</label>
                    <input
                      type="text"
                      value={newMeasDrop}
                      onChange={(e) => setNewMeasDrop(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Verification Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Laser measured. No structural obstructions for cabinetry."
                    value={newMeasNotes}
                    onChange={(e) => setNewMeasNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsMeasurementModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    Save Measurement Log
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: UPLOAD SITE PROGRESS PHOTO                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-navy-950 text-base">Upload Site Progress Photo</h3>
                </div>
                <button onClick={() => setIsPhotoModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPhoto} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-navy-950 block mb-1">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or cloud storage URL"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Leave blank for sample site photo.</span>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Room / Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. Modular Kitchen, Master Suite, Living Room"
                    value={newPhotoRoom}
                    onChange={(e) => setNewPhotoRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Inspection Caption / Observations</label>
                  <textarea
                    rows={2}
                    placeholder="Describe progress stage, quality checks, or pending items..."
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsPhotoModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    Upload Photo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: FULLSCREEN PHOTO LIGHTBOX PREVIEW                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewPhoto && (
          <div
            className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewPhoto}
                alt="Site Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-navy-950/70 hover:bg-navy-950 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
