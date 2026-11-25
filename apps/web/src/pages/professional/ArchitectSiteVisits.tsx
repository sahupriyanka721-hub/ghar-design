import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  getArchitectSiteVisits,
  saveArchitectSiteVisit,
  ArchitectSiteVisit,
  SiteVisitStatus,
} from '../../data/architectPanelStore.js';

export const ArchitectSiteVisits: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [visits, setVisits] = useState<ArchitectSiteVisit[]>(() => getArchitectSiteVisits());
  const [projects] = useState(() => getExecutionProjects());

  const [isScheduleOpen, setIsScheduleOpen] = useState(searchParams.get('action') === 'schedule');
  const [selectedVisitForReport, setSelectedVisitForReport] = useState<ArchitectSiteVisit | null>(null);

  // New Visit Form State
  const [newVisitForm, setNewVisitForm] = useState({
    projectId: projects[0]?.id || '',
    customerName: projects[0]?.customerName || '',
    customerPhone: projects[0]?.customerPhone || '',
    propertyLocation: projects[0]?.location || '',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: '10:30 AM',
    purpose: 'Initial site measurement, boundary verification, and soil inspection.',
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
    groundLevelRelative: '1.5 ft above road level',
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
      plotWidth: v.measurements.plotWidth || '30 ft',
      plotLength: v.measurements.plotLength || '50 ft',
      totalPlotArea: v.measurements.totalPlotArea || '1500 sq ft',
      frontRoadWidth: v.measurements.frontRoadWidth || '30 ft road',
      northSetback: v.measurements.northSetback || '5 ft',
      southSetback: v.measurements.southSetback || '3 ft',
      eastSetback: v.measurements.eastSetback || '3 ft',
      westSetback: v.measurements.westSetback || '3 ft',
      soilCondition: v.measurements.soilCondition || 'Firm soil',
      groundLevelRelative: v.measurements.groundLevelRelative || '+1.5 ft',
      existingStructures: v.measurements.existingStructures || 'Vacant plot',
      siteConditions: v.siteConditions || 'Dry and clear',
      observations: v.observations || 'Satisfactory site conditions.',
      recommendations: v.recommendations || 'Proceed with design.',
      nextSteps: v.nextSteps || 'Issue 2D floor plans.',
      photographs: v.photographs || [],
    });
  };

  const handleScheduleVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const selProj = projects.find((p) => p.id === newVisitForm.projectId) || projects[0];

    const newVisit: ArchitectSiteVisit = {
      id: `VISIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: selProj?.id || 'PROJ-DEFAULT',
      projectTitle: selProj?.title || 'Residential Architectural Project',
      customerName: newVisitForm.customerName || selProj?.customerName || 'Homeowner',
      customerPhone: newVisitForm.customerPhone || selProj?.customerPhone || '',
      propertyLocation: newVisitForm.propertyLocation || selProj?.location || 'Local Site',
      visitDate: newVisitForm.visitDate,
      visitTime: newVisitForm.visitTime,
      status: 'SCHEDULED',
      purpose: newVisitForm.purpose,
      measurements: {
        plotWidth: '30 ft',
        plotLength: '50 ft',
        totalPlotArea: '1500 sq ft',
        frontRoadWidth: '30 ft',
        northSetback: '5 ft',
        southSetback: '3 ft',
        eastSetback: '3 ft',
        westSetback: '3 ft',
      },
      photographs: [],
      siteConditions: 'Awaiting on-site inspection.',
      observations: '',
      recommendations: '',
      nextSteps: '',
      reportSubmitted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveArchitectSiteVisit(newVisit);
    reloadVisits();
    setIsScheduleOpen(false);
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
    alert('Site Inspection Report saved & released to Customer Panel successfully!');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-navy-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-200 border border-amber-400/30 uppercase tracking-wider font-mono">
                Section 7 & 12 Site Visits
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Site Verification & Geo-Demarcation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Site Visit & Technical Inspection Management
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/80 max-w-2xl mt-1 leading-relaxed">
              Schedule on-site visits with clients, capture precision plot measurements, upload geo-tagged site photographs, and submit formal structural inspection reports to Admin and Homeowner.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white text-navy-950 font-black text-xs hover:bg-slate-50 transition shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Schedule New Site Visit</span>
            </button>
          </div>
        </div>
      </div>

      {/* VISITS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80">
          <div>
            <h2 className="text-sm font-black text-navy-950">Site Visits Log ({visits.length})</h2>
            <p className="text-xs text-slate-500">Scheduled and completed engineering inspections</p>
          </div>
        </div>

        {visits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visits.map((v) => {
              const isCompleted = v.status === 'COMPLETED';
              return (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-400">{v.id}</span>
                      <Badge variant={isCompleted ? 'success' : 'warning'} size="sm">
                        {v.status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-navy-950">{v.customerName}</h3>
                      <div className="text-xs text-slate-500 font-medium truncate">{v.projectTitle}</div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{v.visitDate} at {v.visitTime}</span>
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

                    {v.reportSubmitted && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Inspection Report Submitted to Client</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReportEditor(v)}
                      className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 text-xs font-bold border border-slate-200 transition text-center flex items-center justify-center gap-1.5"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{v.reportSubmitted ? 'View / Edit Report' : 'Fill Inspection Report'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">No Site Visits Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Schedule site visits with homeowners to collect precision plot measurements and verify site conditions.
            </p>
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-sm transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Initial Site Visit</span>
            </button>
          </div>
        )}
      </div>

      {/* SCHEDULE MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsScheduleOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-950">Schedule Site Visit (12.0)</h3>
                <p className="text-xs text-slate-500">Plan on-site inspection and measurements</p>
              </div>
            </div>

            <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Project</label>
                <select
                  value={newVisitForm.projectId}
                  onChange={(e) => {
                    const sel = projects.find((p) => p.id === e.target.value);
                    setNewVisitForm({
                      ...newVisitForm,
                      projectId: e.target.value,
                      customerName: sel?.customerName || '',
                      customerPhone: sel?.customerPhone || '',
                      propertyLocation: sel?.location || '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.code} ({p.customerName})
                    </option>
                  ))}
                  {projects.length === 0 && <option value="DEFAULT">General Site Visit</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Visit Date</label>
                  <input
                    type="date"
                    required
                    value={newVisitForm.visitDate}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Visit Time</label>
                  <input
                    type="text"
                    required
                    value={newVisitForm.visitTime}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitTime: e.target.value })}
                    placeholder="e.g. 11:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Site Location & Landmark</label>
                <input
                  type="text"
                  required
                  value={newVisitForm.propertyLocation}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, propertyLocation: e.target.value })}
                  placeholder="Plot No, Street, Sector, City"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose of Visit</label>
                <textarea
                  rows={2}
                  value={newVisitForm.purpose}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-md transition flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECTION REPORT EDITOR MODAL */}
      {selectedVisitForReport && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedVisitForReport(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-950">Technical Site Inspection Report (12.0)</h3>
                <p className="text-xs text-slate-500">
                  Target: {selectedVisitForReport.customerName} • {selectedVisitForReport.propertyLocation}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveReport} className="space-y-5 text-xs">
              {/* MEASUREMENTS SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-emerald-600" />
                  <span>Plot Measurements & Municipal Setbacks</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Plot Width</label>
                    <input
                      type="text"
                      value={reportForm.plotWidth}
                      onChange={(e) => setReportForm({ ...reportForm, plotWidth: e.target.value })}
                      placeholder="e.g. 30 ft"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Plot Length</label>
                    <input
                      type="text"
                      value={reportForm.plotLength}
                      onChange={(e) => setReportForm({ ...reportForm, plotLength: e.target.value })}
                      placeholder="e.g. 50 ft"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Total Plot Area</label>
                    <input
                      type="text"
                      value={reportForm.totalPlotArea}
                      onChange={(e) => setReportForm({ ...reportForm, totalPlotArea: e.target.value })}
                      placeholder="e.g. 1500 sq ft"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Front Road Width</label>
                    <input
                      type="text"
                      value={reportForm.frontRoadWidth}
                      onChange={(e) => setReportForm({ ...reportForm, frontRoadWidth: e.target.value })}
                      placeholder="e.g. 30 ft road"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">North Setback</label>
                    <input
                      type="text"
                      value={reportForm.northSetback}
                      onChange={(e) => setReportForm({ ...reportForm, northSetback: e.target.value })}
                      placeholder="5 ft"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">South Setback</label>
                    <input
                      type="text"
                      value={reportForm.southSetback}
                      onChange={(e) => setReportForm({ ...reportForm, southSetback: e.target.value })}
                      placeholder="3 ft"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">East Setback</label>
                    <input
                      type="text"
                      value={reportForm.eastSetback}
                      onChange={(e) => setReportForm({ ...reportForm, eastSetback: e.target.value })}
                      placeholder="3 ft"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">West Setback</label>
                    <input
                      type="text"
                      value={reportForm.westSetback}
                      onChange={(e) => setReportForm({ ...reportForm, westSetback: e.target.value })}
                      placeholder="3 ft"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SITE CONDITIONS & OBSERVATIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Soil & Site Conditions</label>
                  <textarea
                    rows={2}
                    value={reportForm.soilCondition}
                    onChange={(e) => setReportForm({ ...reportForm, soilCondition: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Architectural Observations</label>
                  <textarea
                    rows={2}
                    value={reportForm.observations}
                    onChange={(e) => setReportForm({ ...reportForm, observations: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recommendations for Client</label>
                  <textarea
                    rows={2}
                    value={reportForm.recommendations}
                    onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Architectural Steps</label>
                  <textarea
                    rows={2}
                    value={reportForm.nextSteps}
                    onChange={(e) => setReportForm({ ...reportForm, nextSteps: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* PHOTOGRAPHS UPLOAD */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Site Inspection Photographs</label>
                <div className="flex flex-wrap items-center gap-3">
                  {reportForm.photographs.map((photo) => (
                    <div key={photo.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                      <img src={photo.url} alt="Site" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-500 flex flex-col items-center justify-center text-slate-400 hover:text-amber-600 transition cursor-pointer">
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Add Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedVisitForReport(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Publish Report to Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
