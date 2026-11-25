import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  Plus,
  CheckCircle2,
  FileText,
  FileDown,
  User,
  Phone,
  Ruler,
  AlertCircle,
  X,
  Upload,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  Check,
  Share2,
  Eye,
  Sliders,
  CalendarDays,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import { getExecutionProjects, ExecutionProject } from '../../data/projectExecutionStore.js';
import {
  getArchitectSiteVisits,
  saveArchitectSiteVisit,
  ArchitectSiteVisit,
  SiteVisitStatus,
} from '../../data/architectPanelStore.js';
import { formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';

type TabType = 'calendar' | 'schedule' | 'reports';

export const ArchitectSiteVisits: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const tabParam = searchParams.get('tab') as TabType;
  const activeTab: TabType = useMemo(() => {
    if (tabParam === 'calendar' || tabParam === 'schedule' || tabParam === 'reports') {
      return tabParam;
    }
    if (searchParams.get('action') === 'schedule') return 'schedule';
    return 'calendar';
  }, [tabParam, searchParams]);

  const setActiveTab = (tab: TabType) => {
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

  // Seed default site visits if none exist
  const ensureDefaultVisits = (): ArchitectSiteVisit[] => {
    const stored = getArchitectSiteVisits();
    if (stored.length > 0) return stored;

    const defaultVisits: ArchitectSiteVisit[] = [
      {
        id: 'VISIT-2026-01',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        customerPhone: '+91 9876543210',
        propertyLocation: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
        visitDate: '2026-11-05',
        visitTime: '10:30 AM',
        status: 'COMPLETED',
        purpose: 'Initial site measurement, boundary peg verification, and soil bearing capacity inspection.',
        reportSubmitted: true,
        reportSubmittedAt: '2026-11-05T16:00:00Z',
        createdAt: '2026-11-01T09:00:00Z',
        updatedAt: '2026-11-05T16:00:00Z',
        measurements: {
          plotWidth: '30 ft 0 in',
          plotLength: '50 ft 0 in',
          totalPlotArea: '1,500 sq.ft',
          frontRoadWidth: '40 ft main sector road',
          northSetback: '5 ft 0 in (Vastu corridor)',
          southSetback: '3 ft 6 in',
          eastSetback: '4 ft 0 in',
          westSetback: '3 ft 6 in',
          soilCondition: 'Medium-dense black cotton soil. SBC estimated at 180 kN/m2.',
          groundLevelRelative: '+1.5 ft above road crown benchmark',
          existingStructures: 'Clear residential plot, concrete corner pillars demarcated',
        },
        siteConditions: 'Excellent vehicle access, electric line overhead cleared, dry weather.',
        observations: 'Demarcation pillars match municipal layout. Road level benchmark established on North-East curb.',
        recommendations: 'Recommended plinth beam elevation at minimum +2.5 ft above road crown for drainage slope.',
        nextSteps: 'Proceed with Vastu-compliant preliminary 2D floor plans.',
        photographs: [
          {
            id: 'ph-1',
            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
            caption: 'Site demarcation boundary pegs verified with auto-level datum',
            uploadedAt: '2026-11-05T11:00:00Z',
          },
          {
            id: 'ph-2',
            url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
            caption: 'Front road access and 40ft road width clearance',
            uploadedAt: '2026-11-05T11:15:00Z',
          },
        ],
      },
      {
        id: 'VISIT-2026-02',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        customerPhone: '+91 9876543210',
        propertyLocation: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
        visitDate: '2026-11-18',
        visitTime: '02:00 PM',
        status: 'COMPLETED',
        purpose: 'Plinth level column starter inspection and reinforcement cover audit.',
        reportSubmitted: true,
        reportSubmittedAt: '2026-11-18T17:30:00Z',
        createdAt: '2026-11-16T10:00:00Z',
        updatedAt: '2026-11-18T17:30:00Z',
        measurements: {
          plotWidth: '30 ft',
          plotLength: '50 ft',
          totalPlotArea: '1500 sq.ft',
          frontRoadWidth: '40 ft',
          northSetback: '5 ft',
          southSetback: '3.5 ft',
          eastSetback: '4 ft',
          westSetback: '3.5 ft',
          soilCondition: 'Compacted gravel bed under footing',
          groundLevelRelative: '+2.5 ft plinth achieved',
          existingStructures: '12 RCC column starters casted',
        },
        siteConditions: 'Active foundation work progressing smoothly.',
        observations: 'IS 456 40mm clear cover on footings verified. Fe550D reinforcement tying approved.',
        recommendations: 'Continue water ponding curing for minimum 14 days.',
        nextSteps: 'Issue ground floor brickwork and lintel height schedules.',
        photographs: [
          {
            id: 'ph-3',
            url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
            caption: 'Plinth beam shuttering and rebar spacing inspection',
            uploadedAt: '2026-11-18T14:30:00Z',
          },
        ],
      },
      {
        id: 'VISIT-2026-03',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        customerPhone: '+91 9876543210',
        propertyLocation: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
        visitDate: '2026-11-28',
        visitTime: '11:00 AM',
        status: 'SCHEDULED',
        purpose: 'First floor slab casting shuttering & electrical conduit layout inspection.',
        reportSubmitted: false,
        createdAt: '2026-11-22T08:00:00Z',
        updatedAt: '2026-11-22T08:00:00Z',
        measurements: {
          plotWidth: '30 ft',
          plotLength: '50 ft',
          totalPlotArea: '1500 sq.ft',
          frontRoadWidth: '40 ft',
        },
        siteConditions: 'Awaiting site audit.',
        observations: '',
        recommendations: '',
        nextSteps: '',
        photographs: [],
      },
    ];

    defaultVisits.forEach((v) => saveArchitectSiteVisit(v));
    return defaultVisits;
  };

  const [visits, setVisits] = useState<ArchitectSiteVisit[]>(ensureDefaultVisits);
  const [selectedVisitForReport, setSelectedVisitForReport] = useState<ArchitectSiteVisit | null>(null);
  const [printVisit, setPrintVisit] = useState<ArchitectSiteVisit | null>(null);

  // New Visit Form State
  const [newVisitForm, setNewVisitForm] = useState({
    projectId: projects[0]?.id || '',
    customerName: projects[0]?.customerName || '',
    customerPhone: projects[0]?.customerPhone || '',
    propertyLocation: projects[0]?.propertyAddress || (projects[0] as any)?.location || '',
    visitDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    visitTime: '11:00 AM',
    purpose: 'Routine architectural structural inspection and client progress review.',
  });

  // Report Editor Form State
  const [reportForm, setReportForm] = useState({
    plotWidth: '',
    plotLength: '',
    totalPlotArea: '',
    frontRoadWidth: '',
    northSetback: '',
    southSetback: '',
    eastSetback: '',
    westSetback: '',
    soilCondition: 'Firm black cotton soil, standard footing recommended',
    groundLevelRelative: '+1.5 ft above road level',
    existingStructures: 'Clear vacant residential plot, boundary pillars demarcated',
    siteConditions: 'Good accessibility for construction vehicles, electric poles clear.',
    observations: 'Boundary pegs accurately demarcated. North orientation verified with sun path.',
    recommendations: 'Recommended plinth beam elevation at +2.0 ft from crown of road.',
    nextSteps: 'Proceed with preliminary architectural concept floor plan.',
    photographs: [] as Array<{ id: string; url: string; caption: string; uploadedAt: string }>,
  });

  const reloadVisits = () => {
    setVisits(getArchitectSiteVisits());
  };

  useEffect(() => {
    window.addEventListener('storage', reloadVisits);
    return () => window.removeEventListener('storage', reloadVisits);
  }, []);

  const handleOpenReportEditor = (v: ArchitectSiteVisit) => {
    setSelectedVisitForReport(v);
    setReportForm({
      plotWidth: v.measurements.plotWidth || '30 ft 0 in',
      plotLength: v.measurements.plotLength || '50 ft 0 in',
      totalPlotArea: v.measurements.totalPlotArea || '1,500 sq.ft',
      frontRoadWidth: v.measurements.frontRoadWidth || '40 ft main road',
      northSetback: v.measurements.northSetback || '5 ft 0 in',
      southSetback: v.measurements.southSetback || '3 ft 6 in',
      eastSetback: v.measurements.eastSetback || '4 ft 0 in',
      westSetback: v.measurements.westSetback || '3 ft 6 in',
      soilCondition: v.measurements.soilCondition || 'Medium-dense black cotton soil',
      groundLevelRelative: v.measurements.groundLevelRelative || '+1.5 ft',
      existingStructures: v.measurements.existingStructures || 'Vacant residential plot',
      siteConditions: v.siteConditions || 'Dry and clear',
      observations: v.observations || 'Boundary pegs accurately verified.',
      recommendations: v.recommendations || 'Proceed with design.',
      nextSteps: v.nextSteps || 'Issue working drawings.',
      photographs: v.photographs || [],
    });
  };

  const handleScheduleVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const selProj = projects.find((p) => p.id === newVisitForm.projectId) || projects[0];

    const newVisit: ArchitectSiteVisit = {
      id: `VISIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: selProj?.id || 'PROJ-DEFAULT',
      projectTitle: selProj?.name || (selProj as any)?.title || 'Residential Architectural Project',
      customerName: newVisitForm.customerName || selProj?.customerName || 'Homeowner',
      customerPhone: newVisitForm.customerPhone || selProj?.customerPhone || '',
      propertyLocation: newVisitForm.propertyLocation || selProj?.propertyAddress || (selProj as any)?.location || 'Local Site',
      visitDate: newVisitForm.visitDate,
      visitTime: newVisitForm.visitTime,
      status: 'SCHEDULED',
      purpose: newVisitForm.purpose,
      measurements: {
        plotWidth: '30 ft',
        plotLength: '50 ft',
        totalPlotArea: '1,500 sq.ft',
        frontRoadWidth: '40 ft',
        northSetback: '5 ft',
        southSetback: '3 ft',
        eastSetback: '3 ft',
        westSetback: '3 ft',
      },
      photographs: [],
      siteConditions: 'Awaiting on-site engineering audit.',
      observations: '',
      recommendations: '',
      nextSteps: '',
      reportSubmitted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveArchitectSiteVisit(newVisit);
    reloadVisits();
    setActiveTab('calendar');
    success(`Site visit scheduled for ${newVisit.visitDate} at ${newVisit.visitTime}! Client notified.`);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitForReport) return;

    const updatedVisit: ArchitectSiteVisit = {
      ...selectedVisitForReport,
      status: 'COMPLETED',
      reportSubmitted: true,
      reportSubmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      measurements: {
        plotWidth: reportForm.plotWidth,
        plotLength: reportForm.plotLength,
        totalPlotArea: reportForm.totalPlotArea,
        frontRoadWidth: reportForm.frontRoadWidth,
        northSetback: reportForm.northSetback,
        southSetback: reportForm.southSetback,
        eastSetback: reportForm.eastSetback,
        westSetback: reportForm.westSetback,
        soilCondition: reportForm.soilCondition,
        groundLevelRelative: reportForm.groundLevelRelative,
        existingStructures: reportForm.existingStructures,
      },
      siteConditions: reportForm.siteConditions,
      observations: reportForm.observations,
      recommendations: reportForm.recommendations,
      nextSteps: reportForm.nextSteps,
      photographs: reportForm.photographs,
    };

    saveArchitectSiteVisit(updatedVisit);
    reloadVisits();
    setSelectedVisitForReport(null);
    success('Site Inspection Report saved & synchronized with Customer & Admin panels!');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newPhoto = {
        id: `photo-${Date.now()}`,
        url: reader.result as string,
        caption: file.name,
        uploadedAt: new Date().toISOString(),
      };
      setReportForm((prev) => ({
        ...prev,
        photographs: [...prev.photographs, newPhoto],
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 7)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <MapPin className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  7. Site Visit & Technical Inspection Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  {visits.length} Visits Logged
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Precision dimensional measurements, Vastu sun-path audits, site photos, and structural compliance inspection reports.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Schedule Action */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('schedule')}
            className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Visit</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 7 SUB-NAVIGATION TABS (7.1 to 7.5)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>7.2 Upcoming Visits & Calendar ({visits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>7.1 Schedule / Request Site Visit</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>7.3 & 7.4 Inspection Reports & Measurements</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: UPCOMING VISITS & CALENDAR
      ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visits.map((v) => {
              const isCompleted = v.status === 'COMPLETED';
              return (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-400">{v.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isCompleted ? 'bg-blue-100 text-blue-900' : 'bg-sky-100 text-sky-900'
                      }`}>
                        {v.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-navy-950">{v.customerName}</h3>
                      <div className="text-xs text-slate-500 font-medium truncate mt-0.5">{v.projectTitle}</div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                        <span className="font-bold">{formatDate(v.visitDate)} at {v.visitTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{v.propertyLocation}</span>
                      </div>
                      {v.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{v.customerPhone}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                      {v.purpose}
                    </p>

                    {v.reportSubmitted && (
                      <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                        <span>Inspection Report Filed & Verified</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReportEditor(v)}
                      className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 text-xs font-bold border border-slate-200 transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{v.reportSubmitted ? 'View / Edit Report' : 'Fill Inspection Report'}</span>
                    </button>
                    {v.reportSubmitted && (
                      <button
                        onClick={() => setPrintVisit(v)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        title="Print Report"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SCHEDULE / REQUEST SITE VISIT
      ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6 max-w-2xl mx-auto">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy-950">Schedule Technical Site Inspection</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm site visit date and agenda with the Homeowner and Site Contractor.
            </p>
          </div>

          <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Project</label>
              <select
                value={newVisitForm.projectId}
                onChange={(e) => {
                  const sel = projects.find((p) => p.id === e.target.value);
                  setNewVisitForm({
                    ...newVisitForm,
                    projectId: e.target.value,
                    customerName: sel?.customerName || '',
                    customerPhone: sel?.customerPhone || '',
                    propertyLocation: sel?.propertyAddress || (sel as any)?.location || '',
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || (p as any).title} ({p.customerName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={newVisitForm.customerName}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, customerName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Phone</label>
                <input
                  type="text"
                  value={newVisitForm.customerPhone}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, customerPhone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Site Property Address</label>
              <input
                type="text"
                value={newVisitForm.propertyLocation}
                onChange={(e) => setNewVisitForm({ ...newVisitForm, propertyLocation: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Visit Date *</label>
                <input
                  type="date"
                  required
                  value={newVisitForm.visitDate}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, visitDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot *</label>
                <input
                  type="text"
                  required
                  value={newVisitForm.visitTime}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, visitTime: e.target.value })}
                  placeholder="10:30 AM"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Inspection Purpose & Scope *</label>
              <textarea
                rows={3}
                required
                value={newVisitForm.purpose}
                onChange={(e) => setNewVisitForm({ ...newVisitForm, purpose: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
              An SMS / WhatsApp notification will be automatically delivered to the homeowner with visit coordinates.
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-gold px-6 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Schedule Site Visit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 3: REPORTS & PHYSICAL MEASUREMENTS
      ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-navy-950">Technical Site Inspection Dossiers</h2>
            <div className="space-y-3">
              {visits.filter((v) => v.reportSubmitted).map((v) => (
                <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{v.customerName}</span>
                      <span className="text-slate-400 font-mono text-[11px] ml-2">({v.id})</span>
                    </div>
                    <span className="font-mono text-slate-500">{formatDate(v.visitDate)}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-mono">Dimensions:</span>
                      <span className="font-bold text-slate-800">{v.measurements.plotWidth} x {v.measurements.plotLength}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">Benchmark Level:</span>
                      <span className="font-bold text-slate-800">{v.measurements.groundLevelRelative || '+1.5 ft'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">Front Road:</span>
                      <span className="font-bold text-slate-800">{v.measurements.frontRoadWidth || '40 ft'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">Photos:</span>
                      <span className="font-bold text-blue-900">{v.photographs.length} Captured</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenReportEditor(v)}
                      className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold"
                    >
                      Edit Report
                    </button>
                    <button
                      onClick={() => setPrintVisit(v)}
                      className="px-3 py-1.5 btn-gold font-bold rounded-lg flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: REPORT EDITOR MODAL (7.3, 7.4, 7.5)
      ========================================================================= */}
      {selectedVisitForReport && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Site Inspection Report: {selectedVisitForReport.customerName}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedVisitForReport.projectTitle} • Date: {selectedVisitForReport.visitDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisitForReport(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSaveReport} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* Physical Measurements */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px] flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-blue-900" />
                  <span>7.4 Physical On-Site Measurements</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Plot Width</label>
                    <input
                      type="text"
                      value={reportForm.plotWidth}
                      onChange={(e) => setReportForm({ ...reportForm, plotWidth: e.target.value })}
                      placeholder="e.g. 30 ft"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Plot Length</label>
                    <input
                      type="text"
                      value={reportForm.plotLength}
                      onChange={(e) => setReportForm({ ...reportForm, plotLength: e.target.value })}
                      placeholder="e.g. 50 ft"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Total Plot Area</label>
                    <input
                      type="text"
                      value={reportForm.totalPlotArea}
                      onChange={(e) => setReportForm({ ...reportForm, totalPlotArea: e.target.value })}
                      placeholder="e.g. 1500 sq.ft"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Front Road Width</label>
                    <input
                      type="text"
                      value={reportForm.frontRoadWidth}
                      onChange={(e) => setReportForm({ ...reportForm, frontRoadWidth: e.target.value })}
                      placeholder="e.g. 40 ft"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Setbacks Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">North Setback</label>
                    <input
                      type="text"
                      value={reportForm.northSetback}
                      onChange={(e) => setReportForm({ ...reportForm, northSetback: e.target.value })}
                      placeholder="e.g. 5 ft"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">South Setback</label>
                    <input
                      type="text"
                      value={reportForm.southSetback}
                      onChange={(e) => setReportForm({ ...reportForm, southSetback: e.target.value })}
                      placeholder="e.g. 3 ft"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">East Setback</label>
                    <input
                      type="text"
                      value={reportForm.eastSetback}
                      onChange={(e) => setReportForm({ ...reportForm, eastSetback: e.target.value })}
                      placeholder="e.g. 3 ft"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">West Setback</label>
                    <input
                      type="text"
                      value={reportForm.westSetback}
                      onChange={(e) => setReportForm({ ...reportForm, westSetback: e.target.value })}
                      placeholder="e.g. 3 ft"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Observations */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-900" />
                  <span>7.3 Observations & Recommendations</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Soil Condition & Strata</label>
                    <input
                      type="text"
                      value={reportForm.soilCondition}
                      onChange={(e) => setReportForm({ ...reportForm, soilCondition: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Ground Level vs Road Datum</label>
                    <input
                      type="text"
                      value={reportForm.groundLevelRelative}
                      onChange={(e) => setReportForm({ ...reportForm, groundLevelRelative: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Detailed Technical Observations</label>
                  <textarea
                    rows={2}
                    value={reportForm.observations}
                    onChange={(e) => setReportForm({ ...reportForm, observations: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Architectural Recommendations</label>
                  <textarea
                    rows={2}
                    value={reportForm.recommendations}
                    onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Photographs Gallery */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px] flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-900" />
                    <span>7.5 Site Photographs & Evidence ({reportForm.photographs.length})</span>
                  </h4>
                  <label className="px-3 py-1 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {reportForm.photographs.map((photo) => (
                    <div key={photo.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      <img src={photo.url} alt={photo.caption} className="w-full h-24 object-cover" />
                      <div className="p-2 text-[10px] text-slate-600 line-clamp-1">{photo.caption}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedVisitForReport(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Submit Inspection Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: PRINT DOSSIER MODAL
      ========================================================================= */}
      {printVisit && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Site Visit Inspection Certificate</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-gold px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button onClick={() => setPrintVisit(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 font-sans">
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">BuildGhar Architectural Technical Audit</h4>
                  <p className="text-[11px] text-slate-500">Ref: {printVisit.id}</p>
                </div>
                <span className="font-mono text-slate-600">{formatDate(printVisit.visitDate)}</span>
              </div>

              <div>
                <strong>Client:</strong> {printVisit.customerName} ({printVisit.customerPhone})
              </div>
              <div>
                <strong>Site Address:</strong> {printVisit.propertyLocation}
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 bg-white rounded-xl border border-slate-100">
                <div><strong>Plot Area:</strong> {printVisit.measurements.totalPlotArea || '1500 sq.ft'}</div>
                <div><strong>Dimensions:</strong> {printVisit.measurements.plotWidth} x {printVisit.measurements.plotLength}</div>
                <div><strong>Soil:</strong> {printVisit.measurements.soilCondition}</div>
                <div><strong>Benchmark:</strong> {printVisit.measurements.groundLevelRelative}</div>
              </div>

              <div>
                <strong>Observations:</strong> {printVisit.observations || 'Satisfactory conditions.'}
              </div>
              <div>
                <strong>Recommendations:</strong> {printVisit.recommendations || 'Proceed per approved drawings.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
