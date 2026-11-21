import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import {
  getExecutionProjects,
  ExecutionProject,
  ProjectStatus,
} from '../../../data/projectExecutionStore.js';
import {
  Building2,
  HardHat,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  ArrowRight,
  Search,
  Filter,
  Layers,
  FileCheck,
  TrendingUp,
  MapPin,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

const formatINR = (paise: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
};

export const ProjectsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ExecutionProject[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = () => {
      const list = getExecutionProjects(user?.id, user?.phone);
      setProjects(list);
      setLoading(false);
    };

    refresh();
    const interval = setInterval(refresh, 2500);
    window.addEventListener('storage', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', refresh);
    };
  }, [user?.id, user?.phone]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contractorFirm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'AWAITING_KICKOFF':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full font-bold text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Awaiting Kickoff
          </span>
        );
      case 'START_REQUESTED':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-300 rounded-full font-bold text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600 animate-pulse" /> Start Requested
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[11px] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> In Progress
          </span>
        );
      case 'WORK_PAUSED':
      case 'ON_HOLD':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-full font-bold text-[11px] flex items-center gap-1">
            <PauseCircle className="w-3 h-3 text-rose-600" /> Work Paused
          </span>
        );
      case 'AWAITING_CUSTOMER_APPROVAL':
        return (
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-300 rounded-full font-bold text-[11px] flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-indigo-600" /> Approval Pending
          </span>
        );
      case 'COMPLETED':
      case 'HANDED_OVER':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-400 rounded-full font-bold text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Handed Over
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[11px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      {/* Header with Title and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-navy-50 text-navy-800 border border-navy-200 mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-navy-700" />
            <span>Customer Project Management Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-navy-950">
            My Construction & Design Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete project execution workspace: work plans, stage tracking, daily site reports, milestone escrow payments & handover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/create-request"
            className="px-4 py-2.5 bg-navy-950 text-gold-400 hover:text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-gold-400" />
            <span>Request New Project</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, ID, work order, contractor or city..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900 focus:bg-white transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {[
            { label: 'All Projects', value: 'ALL' },
            { label: 'Awaiting Kickoff', value: 'AWAITING_KICKOFF' },
            { label: 'In Progress', value: 'IN_PROGRESS' },
            { label: 'Start Requested', value: 'START_REQUESTED' },
            { label: 'Approval Due', value: 'AWAITING_CUSTOMER_APPROVAL' },
            { label: 'Handed Over', value: 'HANDED_OVER' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium text-xs transition ${
                filterStatus === f.value
                  ? 'bg-navy-950 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid / Empty State */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading project workspaces...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-950 font-display">No Active Execution Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Execution projects are formally created when you accept an contractor or engineer quotation. You can review your approved quotations or request a new quotation to get started.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard/quotations"
              className="px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-semibold hover:bg-navy-900 transition"
            >
              View My Quotations
            </Link>
            <Link
              to="/dashboard/create-request"
              className="px-4 py-2 bg-gold-500 text-navy-950 rounded-xl text-xs font-bold hover:bg-gold-400 transition"
            >
              Get New Quotation
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-navy-300 hover:shadow-md transition p-5 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Top ID & Status Strip */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-navy-700 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                      {p.id}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      WO: {p.workOrderNumber}
                    </div>
                  </div>
                  {getStatusBadge(p.status)}
                </div>

                {/* Project Title & Address */}
                <div>
                  <h3 className="text-sm font-bold text-navy-950 font-display group-hover:text-blue-700 transition leading-snug">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.propertyAddress}</span>
                  </div>
                </div>

                {/* Contractor Badge */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-navy-900 font-bold text-xs shrink-0">
                    <HardHat className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xs truncate">
                    <div className="font-semibold text-slate-800 truncate">{p.contractorFirm}</div>
                    <div className="text-[11px] text-slate-500 truncate">{p.contractorName}</div>
                  </div>
                </div>

                {/* Progress Bar (Distinguishing Verified vs Reported) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Progress
                    </span>
                    <span className="font-bold font-mono text-emerald-700">
                      {p.overallVerifiedProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.overallVerifiedProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Current: {p.currentStage}</span>
                    <span>Reported: {p.overallReportedProgress}%</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Contract Value</div>
                    <div className="font-bold text-navy-950 font-mono">{formatINR(p.contractValuePaise)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Amount Due</div>
                    <div className={`font-bold font-mono ${p.amountDuePaise > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                      {formatINR(p.amountDuePaise)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                {p.status === 'AWAITING_KICKOFF' ? (
                  <Link
                    to={`/dashboard/projects/${p.id}/kickoff`}
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span>Start Work & Kickoff</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    to={`/dashboard/projects/${p.id}`}
                    className="w-full py-2 px-3 bg-navy-950 hover:bg-navy-900 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span>Open Project Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
