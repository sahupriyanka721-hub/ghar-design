import React, { useState } from 'react';
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
  ShieldCheck,
  Layers,
  MessageSquare,
  Check,
} from 'lucide-react';
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

export const InteriorDesignerSiteManagement: React.FC = () => {
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');
  const [activeTab, setActiveTab] = useState<'VISITS' | 'SNAGS' | 'COORDINATION'>('VISITS');

  const [siteVisits, setSiteVisits] = useState<InteriorSiteVisit[]>(() =>
    getInteriorSiteVisits(selectedProjectId)
  );
  const [siteReports, setSiteReports] = useState<InteriorSiteVisitReport[]>(() =>
    getSiteVisitReports(selectedProjectId)
  );
  const [snags, setSnags] = useState<InteriorSnagItem[]>(() =>
    getInteriorSnagItems(selectedProjectId)
  );
  const [coordinationRequests, setCoordinationRequests] = useState<InteriorCoordinationRequest[]>(() =>
    getInteriorCoordinationRequests(selectedProjectId)
  );

  // Modals
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<InteriorSiteVisit | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedVisitForReport, setSelectedVisitForReport] = useState<InteriorSiteVisit | null>(null);
  const [isSnagModalOpen, setIsSnagModalOpen] = useState(false);
  const [isCoordinationModalOpen, setIsCoordinationModalOpen] = useState(false);

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

  // New Visit Form
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTimeSlot, setVisitTimeSlot] = useState('11:00 AM - 01:00 PM');
  const [visitLocation, setVisitLocation] = useState('');

  // New Snag Form
  const [snagRoom, setSnagRoom] = useState('Modular Kitchen');
  const [snagCategory, setSnagCategory] = useState<InteriorSnagItem['category']>('CARPENTRY');
  const [snagDesc, setSnagDesc] = useState('');
  const [snagSeverity, setSnagSeverity] = useState<InteriorSnagItem['severity']>('MEDIUM');
  const [snagContractor, setSnagContractor] = useState('Lead Carpenter');

  // New Coordination Request Form (Section 12)
  const [coordTarget, setCoordTarget] = useState<CoordinationDiscipline>('ARCHITECT');
  const [coordType, setCoordType] = useState<CoordinationType>('ARCHITECT_DRAWING_REQUEST');
  const [coordTitle, setCoordTitle] = useState('');
  const [coordDescription, setCoordDescription] = useState('');

  // Filter for Coordination
  const [coordFilter, setCoordFilter] = useState<'ALL' | CoordinationDiscipline>('ALL');

  const refreshData = (projId: string) => {
    setSiteVisits(getInteriorSiteVisits(projId));
    setSiteReports(getSiteVisitReports(projId));
    setSnags(getInteriorSnagItems(projId));
    setCoordinationRequests(getInteriorCoordinationRequests(projId));
  };

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    refreshData(projId);
  };

  // Add Visit
  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProj = projects.find((p) => p.id === selectedProjectId);
    const newVisit: Partial<InteriorSiteVisit> = {
      projectId: selectedProjectId,
      projectName: targetProj?.title || 'Interior Project',
      scheduledDate: visitDate || new Date().toISOString().slice(0, 10),
      timeSlot: visitTimeSlot,
      purpose: visitPurpose,
      siteLocation: visitLocation || targetProj?.location || 'Site Address',
      status: 'SCHEDULED',
      photos: [
        'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600',
      ],
    };

    saveInteriorSiteVisit(newVisit);
    refreshData(selectedProjectId);
    setIsVisitModalOpen(false);
    setVisitPurpose('');
    setVisitDate('');
    setVisitLocation('');
  };

  // Reschedule Visit through Admin
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitForReschedule) return;

    requestSiteVisitRescheduleThroughAdmin(
      selectedVisitForReschedule.id,
      rescheduleDate,
      rescheduleReason
    );

    refreshData(selectedProjectId);
    setIsRescheduleModalOpen(false);
    setSelectedVisitForReschedule(null);
    setRescheduleDate('');
    setRescheduleReason('');
  };

  // Submit Site Visit Report to Admin (Section 11)
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProj = projects.find((p) => p.id === selectedProjectId);

    submitSiteVisitReportToAdmin({
      projectId: selectedProjectId,
      projectName: targetProj?.title || 'Interior Architecture Site',
      visitDate: selectedVisitForReport?.scheduledDate || new Date().toISOString().slice(0, 10),
      siteLocation: selectedVisitForReport?.siteLocation || 'Site Location',
      roomMeasurements: reportRoomMeasurements,
      existingSiteCondition: reportExistingCondition,
      designRecommendations: reportRecommendations,
      issuesFound: reportIssuesFound,
      requiredMaterials: reportRequiredMaterials,
      additionalNotes: reportNotes,
      supportingPhotos: [
        'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600',
      ],
      submittedBy: 'Ar. Pooja Mehra',
    });

    refreshData(selectedProjectId);
    setIsReportModalOpen(false);
    setSelectedVisitForReport(null);
    setReportRoomMeasurements('');
    setReportExistingCondition('');
    setReportRecommendations('');
    setReportIssuesFound('');
    setReportRequiredMaterials('');
    setReportNotes('');
  };

  // Add Snag
  const handleAddSnag = (e: React.FormEvent) => {
    e.preventDefault();
    saveInteriorSnagItem({
      projectId: selectedProjectId,
      roomName: snagRoom,
      category: snagCategory,
      description: snagDesc,
      severity: snagSeverity,
      status: 'OPEN',
      assignedContractor: snagContractor,
    });

    refreshData(selectedProjectId);
    setIsSnagModalOpen(false);
    setSnagDesc('');
  };

  // Toggle Snag Status
  const handleToggleSnagStatus = (id: string, currentStatus: string) => {
    if (currentStatus === 'RESOLVED') {
      saveInteriorSnagItem({ id, status: 'OPEN', resolvedDate: undefined });
    } else {
      resolveInteriorSnagItem(id);
    }
    refreshData(selectedProjectId);
  };

  // Create Coordination Request via Admin (Section 12)
  const handleCreateCoordination = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProj = projects.find((p) => p.id === selectedProjectId);

    createCoordinationRequestViaAdmin({
      projectId: selectedProjectId,
      projectName: targetProj?.title || 'Interior Project',
      targetDiscipline: coordTarget,
      type: coordType,
      title: coordTitle,
      description: coordDescription,
      requestedBy: 'Ar. Pooja Mehra',
    });

    refreshData(selectedProjectId);
    setIsCoordinationModalOpen(false);
    setCoordTitle('');
    setCoordDescription('');
  };

  const filteredCoordination =
    coordFilter === 'ALL'
      ? coordinationRequests
      : coordinationRequests.filter((c) => c.targetDiscipline === coordFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Field Inspections & Governance (Sections 11 & 12)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Site Management & Multi-Discipline Coordination
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Conduct laser measurements, submit site audit reports to Admin, track snags, and coordinate across disciplines via BuildGhar PMC mediation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'VISITS' && (
            <>
              <button
                onClick={() => {
                  setSelectedVisitForReport(siteVisits[0] || null);
                  setIsReportModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>Submit Site Report to Admin</span>
              </button>
              <button
                onClick={() => setIsVisitModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Log Site Visit</span>
              </button>
            </>
          )}

          {activeTab === 'SNAGS' && (
            <button
              onClick={() => setIsSnagModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Report Quality Snag</span>
            </button>
          )}

          {activeTab === 'COORDINATION' && (
            <button
              onClick={() => setIsCoordinationModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              <span>New Request via Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Governance Banner for Section 11 & 12 */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-blue-800/40">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wider text-blue-300">
                Centralized Admin Governance Protocol
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Rule 11 & 12 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              All field inspections, visit reschedules, and multi-disciplinary drawing requests (Architect ↔ Contractor ↔ Vendor) are mediated strictly by the BuildGhar PMC Admin Desk. No unmonitored direct site changes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            🔒 Escrow Protected & Mediated
          </span>
        </div>
      </div>

      {/* Top Filter and Project Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('VISITS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'VISITS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Site Visits & Reports ({siteVisits.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SNAGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'SNAGS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Quality & Snag List ({snags.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('COORDINATION')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'COORDINATION'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Multi-Discipline Desk ({coordinationRequests.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-500 font-bold shrink-0">Project Site:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SITE VISITS & AUDIT REPORTS (SECTION 11) */}
      {/* ============================================================== */}
      {activeTab === 'VISITS' && (
        <div className="space-y-6">
          {/* Site Visit Cards */}
          <div className="space-y-4">
            {siteVisits.map((visit) => (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-mono text-xs font-bold">
                        {visit.scheduledDate || (visit as any).visitDate}
                      </span>
                      {visit.timeSlot && (
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {visit.timeSlot}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          visit.status === 'COMPLETED' || visit.status === 'FORWARDED_TO_CUSTOMER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : visit.status === 'RESCHEDULE_REQUESTED'
                            ? 'bg-amber-100 text-amber-800'
                            : visit.status === 'APPROVED_BY_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {visit.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">{visit.purpose}</h3>
                    {visit.siteLocation && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {visit.siteLocation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedVisitForReschedule(visit);
                        setIsRescheduleModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Request Reschedule</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVisitForReport(visit);
                        setIsReportModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Submit Report</span>
                    </button>
                  </div>
                </div>

                {visit.rescheduleReason && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-0.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Admin Reschedule Request Submitted:</span>
                    </div>
                    <div>{visit.rescheduleReason}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-700 mb-1">Laser Measurements & Layout</div>
                    <div className="text-slate-600 leading-relaxed">
                      {visit.measurementsSummary || 'Laser dimensions verified against approved drawing v2.0.'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="font-bold text-emerald-800 mb-1">Site Progress Logged</div>
                    <div className="text-slate-600 leading-relaxed">
                      {visit.workCompleted || 'Carcass alignment and plumbing drop checked.'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <div className="font-bold text-amber-800 mb-1">Pending Next Deliverables</div>
                    <div className="text-slate-600 leading-relaxed">
                      {visit.pendingActivities || 'Approve laminate color samples with homeowner.'}
                    </div>
                  </div>
                </div>

                {/* Photos Gallery */}
                {visit.photos && visit.photos.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Inspection Laser & Site Photos ({visit.photos.length})</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {(visit.photos || []).map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          alt="Site"
                          className="w-32 h-24 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Submitted Site Visit Reports Section (Section 11) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Submitted Site Visit Reports (BG-SVR Desk)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formal survey reports submitted to BuildGhar Admin for engineering review before homeowner delivery.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                {siteReports.length} Reports
              </span>
            </div>

            {siteReports.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No site visit reports submitted for this project yet. Use "Submit Report" above to log detailed observations.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {siteReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {report.id}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          report.status === 'FORWARDED_TO_CUSTOMER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : report.status === 'ADMIN_APPROVED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      Visit Date: {report.visitDate} • Submitted: {new Date(report.submittedAt).toLocaleDateString()}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <strong className="text-slate-800">Measurements:</strong>{' '}
                        <span className="text-slate-600">{report.roomMeasurements}</span>
                      </div>
                      <div>
                        <strong className="text-slate-800">Site Condition:</strong>{' '}
                        <span className="text-slate-600">{report.existingSiteCondition}</span>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Recommendations:</strong>{' '}
                        <span className="text-slate-600">{report.designRecommendations}</span>
                      </div>
                      {report.issuesFound && (
                        <div>
                          <strong className="text-rose-800">Issues Found:</strong>{' '}
                          <span className="text-slate-600">{report.issuesFound}</span>
                        </div>
                      )}
                      {report.requiredMaterials && (
                        <div>
                          <strong className="text-indigo-800">Materials Needed:</strong>{' '}
                          <span className="text-slate-600">{report.requiredMaterials}</span>
                        </div>
                      )}
                    </div>

                    {report.adminFeedback && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                        <strong>Admin Feedback:</strong> {report.adminFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: QUALITY & SNAG LIST (SECTION 12) */}
      {/* ============================================================== */}
      {activeTab === 'SNAGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Snag List & Quality Rectifications</h3>
              <p className="text-xs text-slate-500">Track defects, carpenter/vendor assignments, and Admin verification.</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">
              {snags.filter((s) => s.status === 'RESOLVED').length} / {snags.length} Resolved
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Status & Room</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Snag Issue Description</th>
                  <th className="p-4 text-center">Severity</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4 text-center">Admin Verified</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snags.map((snag) => (
                  <tr key={snag.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-black text-slate-900">{snag.roomName}</div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 ${
                          snag.status === 'RESOLVED' || snag.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : snag.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {snag.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-600">
                      {snag.category || 'CARPENTRY'}
                    </td>
                    <td className="p-4 max-w-sm text-slate-800 font-medium">
                      {snag.description}
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Reported: {snag.reportedDate} {snag.resolvedDate && `• Resolved: ${snag.resolvedDate}`}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          snag.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : snag.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {snag.severity}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {snag.assignedContractor}
                    </td>
                    <td className="p-4 text-center">
                      {snag.adminVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>PMC Verified</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Pending Audit</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleSnagStatus(snag.id, snag.status)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                          snag.status === 'RESOLVED' || snag.status === 'VERIFIED'
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {snag.status === 'RESOLVED' || snag.status === 'VERIFIED' ? 'Reopen Snag' : 'Mark Resolved'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MULTI-DISCIPLINE COORDINATION DESK (SECTION 12) */}
      {/* ============================================================== */}
      {activeTab === 'COORDINATION' && (
        <div className="space-y-4">
          {/* Discipline Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-500 font-bold shrink-0">Filter By Target:</span>
            {(['ALL', 'ARCHITECT', 'CONTRACTOR', 'VENDOR', 'PMC_ADMIN'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setCoordFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  coordFilter === filter
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL'
                  ? 'All Disciplines'
                  : filter === 'ARCHITECT'
                  ? '🏛️ Architect'
                  : filter === 'CONTRACTOR'
                  ? '🔨 General Contractor'
                  : filter === 'VENDOR'
                  ? '📦 Material Vendor'
                  : '🛡️ PMC Admin'}
              </button>
            ))}
          </div>

          {/* Coordination Requests List */}
          <div className="space-y-3">
            {filteredCoordination.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {req.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                      Target: {req.targetDiscipline}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {req.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      req.adminMediationStatus === 'RESOLVED_BY_ADMIN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.adminMediationStatus === 'ADMIN_FORWARDED'
                        ? 'bg-blue-100 text-blue-800'
                        : req.adminMediationStatus === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.adminMediationStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">{req.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{req.description}</p>
                </div>

                {req.adminNotes && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <strong>Admin Mediation Notes:</strong> {req.adminNotes}
                  </div>
                )}

                {req.responseComments && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    <strong>Resolution from {req.targetDiscipline}:</strong> {req.responseComments}
                    {req.resolvedAt && (
                      <span className="block text-[10px] text-emerald-700 font-mono mt-0.5">
                        Resolved on: {new Date(req.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LOG SITE VISIT */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isVisitModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span>Log Site Visit & Laser Measurement</span>
                </div>
                <button
                  onClick={() => setIsVisitModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddVisit} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Visit Purpose *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modular kitchen carcass alignment and countertop measurement verification"
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Scheduled Date *</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Time Slot *</label>
                    <input
                      type="text"
                      required
                      value={visitTimeSlot}
                      onChange={(e) => setVisitTimeSlot(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Site Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Tower 4, Flat 1802, DLF Phase 5, Gurugram"
                    value={visitLocation}
                    onChange={(e) => setVisitLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                  ℹ️ Logging this visit alerts BuildGhar PMC site coordinators and syncs with customer progress updates.
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsVisitModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Save Visit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: REQUEST RESCHEDULE VIA ADMIN */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isRescheduleModalOpen && selectedVisitForReschedule && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-amber-800 font-black text-base">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Request Reschedule via BuildGhar Admin</span>
                </div>
                <button
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-3 mt-4 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                  <strong>Section 11 Governance Rule:</strong> To preserve customer escrow alignment, designers must request reschedule through BuildGhar PMC Admin. Admin coordinates with homeowner and confirms the new appointment.
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Site Visit</label>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                    {selectedVisitForReschedule.purpose}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Preferred New Date *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reason for Reschedule *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Electrical conduit chipping in master bedroom delayed; need 48 hrs before laser survey."
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRescheduleModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition"
                  >
                    Send Reschedule Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: SUBMIT SITE VISIT REPORT TO ADMIN (SECTION 11) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Submit Site Audit Report to Admin (Section 11)</span>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-3 mt-4 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  <strong>Section 11 Mandatory Report Fields:</strong> Reports are reviewed and verified by BuildGhar PMC engineering desk before being released to homeowner.
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Room Measurements & Laser Log *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Living room 5.8m x 4.2m with ceiling clear height 3.1m. Kitchen counter perimeter 14.5 Rft."
                    value={reportRoomMeasurements}
                    onChange={(e) => setReportRoomMeasurements(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Existing Site Condition *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Wall plaster cured. Electrical conduit lines laid per MEP drawing v1.0. Flooring screed level."
                    value={reportExistingCondition}
                    onChange={(e) => setReportExistingCondition(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Design Recommendations *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Recommend offsetting island counter by 150mm east to ensure unblocked refrigerator door swing."
                    value={reportRecommendations}
                    onChange={(e) => setReportRecommendations(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Issues & Conflicts Found</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Balcony drop beam level lower by 50mm than architectural elevation drawing."
                    value={reportIssuesFound}
                    onChange={(e) => setReportIssuesFound(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Required Materials / Procurement</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 24 sheets 18mm Century Club Prime BWP plywood, 4 sets Blum tandembox runners."
                    value={reportRequiredMaterials}
                    onChange={(e) => setReportRequiredMaterials(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Additional Observations / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Site supervisor briefed on laser level tolerances."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Submit Report to Admin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: REPORT QUALITY SNAG */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isSnagModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <span>Report Quality Snag Item</span>
                </div>
                <button
                  onClick={() => setIsSnagModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSnag} className="space-y-3 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Room / Zone *</label>
                    <input
                      type="text"
                      required
                      value={snagRoom}
                      onChange={(e) => setSnagRoom(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Defect Category *</label>
                    <select
                      value={snagCategory}
                      onChange={(e) => setSnagCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                    >
                      <option value="CARPENTRY">Carpentry & Woodwork</option>
                      <option value="ELECTRICAL">Electrical & Lighting</option>
                      <option value="CIVIL">Civil & POP</option>
                      <option value="PAINT_FINISH">Paint & Polish Finish</option>
                      <option value="MODULAR_FITTINGS">Modular Fittings & Hardware</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Defect Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Overhead wall cabinet hydraulic stay has 3mm hinge misalignment causing uneven shutter gap."
                    value={snagDesc}
                    onChange={(e) => setSnagDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Severity *</label>
                    <select
                      value={snagSeverity}
                      onChange={(e) => setSnagSeverity(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="LOW">Low (Cosmetic)</option>
                      <option value="MEDIUM">Medium (Alignment / Hinge)</option>
                      <option value="HIGH">High (Electrical / Plumbing)</option>
                      <option value="CRITICAL">Critical (Structural / Safety)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assign Contractor *</label>
                    <input
                      type="text"
                      required
                      value={snagContractor}
                      onChange={(e) => setSnagContractor(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSnagModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Add to Snag List
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: NEW MULTI-DISCIPLINE COORDINATION REQUEST (SECTION 12) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isCoordinationModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-900 font-black text-base">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                  <span>New Coordination Request (via PMC Admin)</span>
                </div>
                <button
                  onClick={() => setIsCoordinationModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCoordination} className="space-y-3 mt-4 text-xs">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                  <strong>Section 12 Governance Rule:</strong> All requests to Architect, Contractor, or Vendors must be logged here. BuildGhar PMC Admin will review, approve, and mediate with the respective discipline.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Target Discipline *</label>
                    <select
                      value={coordTarget}
                      onChange={(e) => setCoordTarget(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                    >
                      <option value="ARCHITECT">🏛️ Architect</option>
                      <option value="CONTRACTOR">🔨 General Contractor</option>
                      <option value="VENDOR">📦 Material Vendor</option>
                      <option value="PMC_ADMIN">🛡️ PMC Admin Desk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Request Type *</label>
                    <select
                      value={coordType}
                      onChange={(e) => setCoordType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                    >
                      <option value="ARCHITECT_DRAWING_REQUEST">Architect Drawing Request</option>
                      <option value="CONTRACTOR_SITE_ALIGNMENT">Contractor Site Alignment</option>
                      <option value="VENDOR_MATERIAL_SPEC">Vendor Material Spec</option>
                      <option value="INSTALLATION_PLANNING">Installation Planning</option>
                      <option value="QUALITY_DEFECT_ESCALATION">Defect Escalation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Request Subject / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanctioned Column Grid & Drop Beam Levels Drawing Request"
                    value={coordTitle}
                    onChange={(e) => setCoordTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Technical Details & Requirements *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Specify the technical questions, drawing references, beam drops, or material specifications requiring alignment..."
                    value={coordDescription}
                    onChange={(e) => setCoordDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCoordinationModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition"
                  >
                    Submit Request via Admin
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
