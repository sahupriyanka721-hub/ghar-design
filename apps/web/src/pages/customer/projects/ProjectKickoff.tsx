import { BuildGharLoader } from '../../../components/common/BuildGharLoader.js';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import { useToast } from '../../../context/ToastContext.js';
import {
  getExecutionProjectById,
  saveExecutionProject,
  ExecutionProject,
} from '../../../data/projectExecutionStore.js';
import {
  Building2,
  HardHat,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  MapPin,
  FileText,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const formatINR = (paise: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
};

export const ProjectKickoff: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<ExecutionProject | null>(null);
  const [loading, setLoading] = useState(true);

  // Prerequisites checklist states
  const [demarcationReady, setDemarcationReady] = useState(false);
  const [sanctionReady, setSanctionReady] = useState(false);
  const [utilityReady, setUtilityReady] = useState(false);
  const [contractConfirmed, setContractConfirmed] = useState(true);
  const [advanceCommitted, setAdvanceCommitted] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pause / Resume state modal
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('');

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard/projects');
      return;
    }

    const p = getExecutionProjectById(projectId);
    if (p) {
      setProject(p);
      setDemarcationReady(p.kickoff.siteDemarcationReady);
      setSanctionReady(p.kickoff.sanctionReceived);
      setUtilityReady(p.kickoff.utilityConnectionReady);
      setContractConfirmed(p.kickoff.contractAgreed);
      setAdvanceCommitted(p.kickoff.advancePaid);
      setSpecialInstructions(p.kickoff.specialInstructions || '');
    }
    setLoading(false);
  }, [projectId, navigate]);

  if (loading) {
    return <div className="p-16 flex items-center justify-center"><BuildGharLoader message="Loading project kickoff workspace..." /></div>;
  }

  if (!project) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4 font-sans">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-navy-950 font-display">Project Not Found</h2>
        <p className="text-xs text-slate-500">The requested execution project could not be located.</p>
        <Link to="/dashboard/projects" className="btn-primary text-xs py-2 px-4 inline-block">
          Return to Projects
        </Link>
      </div>
    );
  }

  const allPrerequisitesSatisfied =
    demarcationReady && sanctionReady && utilityReady && contractConfirmed && advanceCommitted;

  const handleRequestWorkStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractConfirmed) {
      error('Please confirm acceptance of the agreed contract conditions.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    const updatedKickoff = {
      ...project.kickoff,
      siteDemarcationReady: demarcationReady,
      sanctionReceived: sanctionReady,
      utilityConnectionReady: utilityReady,
      contractAgreed: contractConfirmed,
      advancePaid: advanceCommitted,
      advancePaidPaise: advanceCommitted ? project.kickoff.advanceRequiredPaise : 0,
      specialInstructions,
      requestedAt: now,
    };

    // If all prerequisites are checked, move to IN_PROGRESS directly, else START_REQUESTED
    const nextStatus = allPrerequisitesSatisfied ? 'IN_PROGRESS' : 'START_REQUESTED';

    const updatedProject: ExecutionProject = {
      ...project,
      status: nextStatus,
      actualStartDate: allPrerequisitesSatisfied ? now.split('T')[0] : undefined,
      kickoff: updatedKickoff,
      amountDuePaise: advanceCommitted
        ? Math.max(0, project.amountDuePaise - project.kickoff.advanceRequiredPaise)
        : project.amountDuePaise,
      totalPaidPaise: advanceCommitted
        ? project.totalPaidPaise + project.kickoff.advanceRequiredPaise
        : project.totalPaidPaise,
      updatedAt: now,
      messages: [
        ...project.messages,
        {
          id: `msg-${Date.now()}`,
          senderId: user?.id || 'cust-1',
          senderName: user?.name || 'Homeowner',
          senderRole: 'CUSTOMER',
          message: allPrerequisitesSatisfied
            ? 'All site prerequisites fulfilled and advance confirmed. Official site work commencement authorized!'
            : 'Work start requested! Site prerequisites submitted for contractor mobilization review.',
          timestamp: now,
        },
      ],
    };

    saveExecutionProject(updatedProject);
    setProject(updatedProject);
    setIsSubmitting(false);

    if (allPrerequisitesSatisfied) {
      success('Project officially commenced! Work status is now IN PROGRESS.');
      navigate(`/dashboard/projects/${project.id}`);
    } else {
      success('Work start requested! Contractor and Admin have been notified to confirm site readiness.');
    }
  };

  const handlePauseWork = () => {
    if (!pauseReason.trim()) {
      error('Please specify a reason for pausing site work.');
      return;
    }

    const now = new Date().toISOString();
    const updatedProject: ExecutionProject = {
      ...project,
      status: 'WORK_PAUSED',
      kickoff: {
        ...project.kickoff,
        pauseReason,
      },
      updatedAt: now,
      messages: [
        ...project.messages,
        {
          id: `msg-${Date.now()}`,
          senderId: user?.id || 'cust-1',
          senderName: user?.name || 'Homeowner',
          senderRole: 'CUSTOMER',
          message: `Site work put on hold / paused. Reason: ${pauseReason}`,
          timestamp: now,
        },
      ],
    };

    saveExecutionProject(updatedProject);
    setProject(updatedProject);
    setShowPauseModal(false);
    success('Project work paused. History logged in project communication.');
  };

  const handleResumeWork = () => {
    const now = new Date().toISOString();
    const updatedProject: ExecutionProject = {
      ...project,
      status: 'IN_PROGRESS',
      updatedAt: now,
      messages: [
        ...project.messages,
        {
          id: `msg-${Date.now()}`,
          senderId: user?.id || 'cust-1',
          senderName: user?.name || 'Homeowner',
          senderRole: 'CUSTOMER',
          message: 'Work resume requested. Site execution re-authorized.',
          timestamp: now,
        },
      ],
    };

    saveExecutionProject(updatedProject);
    setProject(updatedProject);
    success('Work resumed! Project status is now IN PROGRESS.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard/projects"
            className="text-xs text-navy-700 hover:text-navy-950 font-semibold flex items-center gap-1 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              Start Work & Project Kickoff
            </h1>
            <span className="font-mono text-xs font-bold bg-navy-100 text-navy-800 px-2.5 py-0.5 rounded border border-navy-200">
              {project.id}
            </span>
          </div>
        </div>

        {/* Existing Status Indicator & Quick Workspace Link */}
        <div className="flex items-center gap-2">
          {project.status === 'IN_PROGRESS' ? (
            <>
              <button
                onClick={() => setShowPauseModal(true)}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-rose-100 transition"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Pause Work
              </button>
              <Link
                to={`/dashboard/projects/${project.id}`}
                className="px-3 py-1.5 bg-navy-950 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-navy-900 transition"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
              </Link>
            </>
          ) : project.status === 'WORK_PAUSED' ? (
            <button
              onClick={handleResumeWork}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Resume Site Work
            </button>
          ) : null}
        </div>
      </div>

      {/* Overview Card: Contract & Stakeholder Specs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Project Name & Type</div>
            <div className="text-base font-bold text-navy-950 font-display mt-0.5">{project.name}</div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.propertyAddress}</span>
            </div>
            <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-800">Work Order No:</span>{' '}
              <span className="font-mono text-navy-900 font-bold">{project.workOrderNumber}</span> |{' '}
              <span className="font-semibold text-slate-800">Quotation:</span> {project.quotationCode}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Contractor / Professional</div>
            <div className="flex items-center gap-3 mt-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-600 font-bold">
                <HardHat className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-navy-950">{project.contractorFirm}</div>
                <div className="text-slate-500">{project.contractorName} • {project.contractorRole}</div>
                <div className="text-[11px] text-blue-700 font-medium">{project.contractorPhone}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <div className="text-[10px] text-slate-400 font-medium">Planned Start</div>
                <div className="font-bold text-navy-950 mt-0.5">{project.plannedStartDate}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <div className="text-[10px] text-slate-400 font-medium">Target Completion</div>
                <div className="font-bold text-navy-950 mt-0.5">{project.plannedEndDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Commitment Card */}
        <div className="bg-navy-950 text-white p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] text-gold-400 font-semibold uppercase tracking-wider">
              Approved Contract Value (BOQ Scope)
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {formatINR(project.contractValuePaise)}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Defect Liability Retention (5%): {formatINR(project.retentionPaise)}
            </div>
          </div>

          <div className="bg-white/10 p-3 rounded-xl text-xs space-y-1 w-full sm:w-auto">
            <div className="text-slate-300">Mobilization Advance Required:</div>
            <div className="text-lg font-bold font-mono text-gold-400">
              {formatINR(project.kickoff.advanceRequiredPaise)}
            </div>
            <div className="text-[11px] text-slate-300">
              Status: {advanceCommitted ? '✓ Advance Confirmed' : '⚠️ Due prior to site excavation'}
            </div>
          </div>
        </div>
      </div>

      {/* Prerequisites & Kickoff Checklist Form */}
      <form onSubmit={handleRequestWorkStart} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-navy-950 font-display flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Site Mobilization Prerequisites Checklist</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            As per GharDesign IS 456 engineering compliance, verify these conditions before contractor equipment and labor mobilize to site.
          </p>
        </div>

        <div className="space-y-3">
          {/* Item 1 */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={demarcationReady}
              onChange={(e) => setDemarcationReady(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-navy-900 border-slate-300 focus:ring-navy-900"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">1. Plot Demarcation & Boundary Boundary Pegging</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Site boundary pillars and physical demarcation are clear and ready for the earthmover / excavation team.
              </p>
            </div>
          </label>

          {/* Item 2 */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={sanctionReady}
              onChange={(e) => setSanctionReady(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-navy-900 border-slate-300 focus:ring-navy-900"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">2. Municipal Sanction & Approved Engineering Map</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Local development authority / municipal sanction or verified engineering working blueprints are available.
              </p>
            </div>
          </label>

          {/* Item 3 */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={utilityReady}
              onChange={(e) => setUtilityReady(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-navy-900 border-slate-300 focus:ring-navy-900"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">3. Construction Water & Power Supply on Site</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Borewell / tanker water facility and continuous temporary electricity meter installed for concrete mixer and curing.
              </p>
            </div>
          </label>

          {/* Item 4 */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={advanceCommitted}
              onChange={(e) => setAdvanceCommitted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-navy-900 border-slate-300 focus:ring-navy-900"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">
                4. Mobilization Advance Escrow ({formatINR(project.kickoff.advanceRequiredPaise)})
              </span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Advance tranche approved for contractor blueprint handover, soil testing, and contractor machinery dispatch.
              </p>
            </div>
          </label>

          {/* Item 5 */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={contractConfirmed}
              onChange={(e) => setContractConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-navy-900 border-slate-300 focus:ring-navy-900"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">5. Master Tripartite Agreement Acceptance</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Confirmed agreement with GharDesign standard construction specifications, milestone escrow release rules, and defect liability terms.
              </p>
            </div>
          </label>
        </div>

        {/* Special Instructions Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Special Instructions / Site Access Notes for Contractor
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            placeholder=""
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900 focus:bg-white transition"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {allPrerequisitesSatisfied ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                All prerequisites ready. Work can start immediately!
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                ⚠️ Complete the 5 prerequisites to start site execution directly.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition ${
              allPrerequisitesSatisfied
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-navy-950 hover:bg-navy-900 text-white'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Submitting...'
                : allPrerequisitesSatisfied
                ? 'Authorize Work Start (Move to In Progress)'
                : 'Submit Work Start Request'}
            </span>
          </button>
        </div>
      </form>

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-navy-950 font-display">Pause Site Work</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pausing site work will put contractor activities on hold and log the reason in the official project history.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Pausing Work</label>
              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                rows={3}
                placeholder=""
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePauseWork}
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 shadow-sm"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
