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
} from 'lucide-react';
import {
  getInteriorSiteVisits,
  getInteriorSnagItems,
  InteriorSiteVisit,
  InteriorSnagItem,
  getInteriorProjects,
} from '../../data/interiorDesignerStore.js';

export const InteriorDesignerSiteManagement: React.FC = () => {
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');
  const [activeTab, setActiveTab] = useState<'VISITS' | 'SNAGS'>('VISITS');
  const [siteVisits, setSiteVisits] = useState<InteriorSiteVisit[]>(() =>
    getInteriorSiteVisits(selectedProjectId)
  );
  const [snags, setSnags] = useState<InteriorSnagItem[]>(() =>
    getInteriorSnagItems(selectedProjectId)
  );

  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isSnagModalOpen, setIsSnagModalOpen] = useState(false);

  // New Visit Form
  const [visitPurpose, setVisitPurpose] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [pendingWork, setPendingWork] = useState('');
  const [nextVisit, setNextVisit] = useState('');

  // New Snag Form
  const [snagRoom, setSnagRoom] = useState('Modular Kitchen');
  const [snagDesc, setSnagDesc] = useState('');
  const [snagSeverity, setSnagSeverity] = useState<InteriorSnagItem['severity']>('MEDIUM');
  const [snagContractor, setSnagContractor] = useState('Lead Carpenter');

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProj = projects.find((p) => p.id === selectedProjectId);
    const newVisit: InteriorSiteVisit = {
      id: `sv-${Date.now()}`,
      projectId: selectedProjectId,
      projectName: targetProj?.title || 'Interior Project',
      visitDate: new Date().toISOString().slice(0, 10),
      purpose: visitPurpose,
      siteEngineer: 'Ar. Pooja Mehra & Site Engineer',
      measurementsSummary: measurements || 'All laser dimensions matched drawing v2.0',
      workCompleted: workDone,
      pendingActivities: pendingWork,
      nextVisitDate: nextVisit || '2026-11-05',
      photos: [
        'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600',
      ],
    };

    const updated = [newVisit, ...siteVisits];
    setSiteVisits(updated);
    try {
      localStorage.setItem('gd_interior_visits_v1', JSON.stringify(updated));
    } catch (e) {}

    setIsVisitModalOpen(false);
    setVisitPurpose('');
    setMeasurements('');
    setWorkDone('');
  };

  const handleAddSnag = (e: React.FormEvent) => {
    e.preventDefault();
    const newSnag: InteriorSnagItem = {
      id: `sng-${Date.now()}`,
      projectId: selectedProjectId,
      roomName: snagRoom,
      description: snagDesc,
      severity: snagSeverity,
      status: 'OPEN',
      reportedDate: new Date().toISOString().slice(0, 10),
      assignedContractor: snagContractor,
    };

    const updated = [newSnag, ...snags];
    setSnags(updated);
    try {
      localStorage.setItem('gd_interior_snags_v1', JSON.stringify(updated));
    } catch (e) {}

    setIsSnagModalOpen(false);
    setSnagDesc('');
  };

  const handleToggleSnagStatus = (id: string) => {
    const updated = snags.map((s) => {
      if (s.id === id) {
        const nextStatus = s.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
        return {
          ...s,
          status: nextStatus as any,
          resolvedDate: nextStatus === 'RESOLVED' ? new Date().toISOString().slice(0, 10) : undefined,
        };
      }
      return s;
    });
    setSnags(updated);
    try {
      localStorage.setItem('gd_interior_snags_v1', JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Field Inspection & Quality Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Site Management & Snag List
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Log site measurement visits, upload before/after photos, and track snag item rectifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'VISITS' ? (
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Site Visit</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSnagModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Report Snag Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Filter and Project Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('VISITS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'VISITS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Site Visit Reports ({siteVisits.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SNAGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'SNAGS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Quality & Snag List ({snags.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-bold shrink-0">Project Site:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSiteVisits(getInteriorSiteVisits(e.target.value));
              setSnags(getInteriorSnagItems(e.target.value));
            }}
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

      {/* TAB 1: SITE VISITS */}
      {activeTab === 'VISITS' && (
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
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-mono text-xs font-bold">
                      {visit.visitDate}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Inspectors: {visit.siteEngineer}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">{visit.purpose}</h3>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Next Scheduled Visit: <strong>{visit.nextVisitDate}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="font-bold text-slate-700 mb-1">Measurements & Laser Log</div>
                  <div className="text-slate-600 leading-relaxed">{visit.measurementsSummary}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="font-bold text-emerald-800 mb-1">Work Completed on Site</div>
                  <div className="text-slate-600 leading-relaxed">{visit.workCompleted}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <div className="font-bold text-amber-800 mb-1">Pending Activities</div>
                  <div className="text-slate-600 leading-relaxed">{visit.pendingActivities}</div>
                </div>
              </div>

              {/* Photos Gallery */}
              {visit.photos && visit.photos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Inspection Site Photos ({visit.photos.length})</span>
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
      )}

      {/* TAB 2: SNAG LIST */}
      {activeTab === 'SNAGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Status & Room</th>
                  <th className="p-4">Snag Issue Description</th>
                  <th className="p-4 text-center">Severity</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4 text-center">Reported / Resolved</th>
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
                          snag.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {snag.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-sm text-slate-800 font-medium">
                      {snag.description}
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
                    <td className="p-4 text-center font-mono text-[11px] text-slate-500">
                      <div>Rep: {snag.reportedDate}</div>
                      {snag.resolvedDate && (
                        <div className="text-emerald-700 font-bold">Res: {snag.resolvedDate}</div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleSnagStatus(snag.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                          snag.status === 'RESOLVED'
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {snag.status === 'RESOLVED' ? 'Reopen Snag' : 'Mark Resolved'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Visit Modal */}
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
                  <span>Log Site Visit Inspection</span>
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
                    placeholder=""
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Measurements Log & Observations
                  </label>
                  <textarea
                    rows={2}
                    placeholder=""
                    value={measurements}
                    onChange={(e) => setMeasurements(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Work Completed on Site</label>
                  <textarea
                    rows={2}
                    placeholder=""
                    value={workDone}
                    onChange={(e) => setWorkDone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pending Next Steps</label>
                    <input
                      type="text"
                      placeholder=""
                      value={pendingWork}
                      onChange={(e) => setPendingWork(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Next Visit Date</label>
                    <input
                      type="date"
                      value={nextVisit}
                      onChange={(e) => setNextVisit(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
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
                    Save Inspection Log
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Snag Modal */}
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
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Room / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={snagRoom}
                    onChange={(e) => setSnagRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Issue Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder=""
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
    </div>
  );
};
