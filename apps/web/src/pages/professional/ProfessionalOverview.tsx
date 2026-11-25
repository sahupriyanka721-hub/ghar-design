import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  Building2,
  FileText,
  FileCheck2,
  CalendarCheck,
  PlusCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Layers,
  MapPin,
  Calendar,
  MessageSquare,
  Compass,
  FileUp,
  ListTodo,
  CheckSquare,
  DollarSign,
  BarChart3,
  Bell,
  Star,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { getPlatformRequests, getPlatformBookings, syncChannel } from '../../data/customerStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  getProfessionalByPhone,
  getProfessionalAccounts,
  getProfessionalPayoutRequests,
} from '../../data/professionalStore.js';
import {
  getArchitectDesigns,
  getArchitectDeliverables,
  getArchitectSiteVisits,
  getArchitectNotifications,
  getArchitectReviews,
  getArchitectChatMessages,
} from '../../data/architectPanelStore.js';

export const ProfessionalOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<'7D' | '30D' | 'ALL'>('ALL');

  // Load real store data with fallback to primary professional fixture
  const archAccount =
    (user?.phone ? getProfessionalByPhone(user.phone) : null) || getProfessionalAccounts()[0] || null;

  const [requests, setRequests] = useState(() =>
    getPlatformRequests().filter((r) => !r.categorySlug || !r.categorySlug.toLowerCase().includes('interior'))
  );
  const [bookings, setBookings] = useState(() => getPlatformBookings());
  const [projects, setProjects] = useState(() => getExecutionProjects());
  const [designs, setDesigns] = useState(() => getArchitectDesigns());
  const [deliverables, setDeliverables] = useState(() => getArchitectDeliverables());
  const [siteVisits, setSiteVisits] = useState(() => getArchitectSiteVisits());
  const [notifications, setNotifications] = useState(() => getArchitectNotifications());
  const [reviews, setReviews] = useState(() => getArchitectReviews());

  const refreshAllData = () => {
    setRequests(
      getPlatformRequests().filter((r) => !r.categorySlug || !r.categorySlug.toLowerCase().includes('interior'))
    );
    setBookings(getPlatformBookings());
    setProjects(getExecutionProjects());
    setDesigns(getArchitectDesigns());
    setDeliverables(getArchitectDeliverables());
    setSiteVisits(getArchitectSiteVisits());
    setNotifications(getArchitectNotifications());
    setReviews(getArchitectReviews());
  };

  useEffect(() => {
    window.addEventListener('storage', refreshAllData);
    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'PROJECT_REQUESTS_UPDATED' ||
        event.data?.type === 'QUOTATIONS_UPDATED' ||
        event.data?.type === 'ARCHITECT_DESIGNS_UPDATED' ||
        event.data?.type === 'ARCHITECT_DELIVERABLES_UPDATED' ||
        event.data?.type === 'ARCHITECT_SITE_VISITS_UPDATED' ||
        event.data?.type === 'ARCHITECT_NOTIFICATIONS_UPDATED' ||
        event.data?.type === 'EXECUTION_PROJECTS_UPDATED'
      ) {
        refreshAllData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    return () => {
      window.removeEventListener('storage', refreshAllData);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  const payouts = getProfessionalPayoutRequests(user?.phone || '');

  // 10 Summary KPIs (Real Records Only)
  const totalAssignedRequests = requests.length;
  const newQuotationRequests = requests.filter((r) => r.status === 'ASSIGNED' || r.status === 'PENDING').length;
  const pendingQuotations = requests.filter((r) => r.status === 'QUOTED' || r.status === 'SUBMITTED').length;
  const acceptedQuotations = bookings.length;
  const activeProjects = projects.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length;
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
  const pendingDesignApprovals = designs.filter(
    (d) => d.status === 'PENDING_CUSTOMER_APPROVAL' || d.status === 'SUBMITTED_TO_ADMIN'
  ).length;

  const now = new Date().getTime();
  const upcomingDeadlines = deliverables.filter((d) => {
    if (d.status === 'COMPLETED') return false;
    const diffDays = (new Date(d.dueDate).getTime() - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const totalContractPaise = projects.reduce(
    (acc, p) => acc + (p.contractValuePaise || (p as any).totalContractPaise || 0),
    0
  );
  // Real earnings from paid milestone portions
  const totalEarningsPaise = projects.reduce((acc, p) => {
    const paidMilestones = p.milestones?.filter((m) => m.paymentStatus === 'PAID') || [];
    return acc + paidMilestones.reduce((mAcc, m) => mAcc + m.amountPaise, 0);
  }, 0);
  const pendingPaymentsPaise = Math.max(0, totalContractPaise - totalEarningsPaise);

  const firmTitle =
    archAccount?.business?.firmName || archAccount?.personal?.name || (user?.name ? `${user.name}` : 'Accredited Architecture Firm');

  // 10 Summary Cards Definition
  const summaryCards = [
    {
      title: 'Total Assigned Requests',
      value: totalAssignedRequests,
      subtext: 'Homeowner briefs allocated by Admin',
      icon: Inbox,
      color: 'blue',
      link: '/professional/assigned',
    },
    {
      title: 'New Quotation Requests',
      value: newQuotationRequests,
      subtext: 'Awaiting quotation preparation',
      icon: PlusCircle,
      color: 'amber',
      link: '/professional/assigned',
    },
    {
      title: 'Pending Quotations',
      value: pendingQuotations,
      subtext: 'Under admin review or homeowner bid review',
      icon: Clock,
      color: 'indigo',
      link: '/professional/quotations',
    },
    {
      title: 'Accepted Quotations',
      value: acceptedQuotations,
      subtext: 'Confirmed homeowner bids & bookings',
      icon: FileCheck2,
      color: 'emerald',
      link: '/professional/quotations/approved',
    },
    {
      title: 'Active Projects',
      value: activeProjects,
      subtext: 'Ongoing architectural design execution',
      icon: Layers,
      color: 'sky',
      link: '/professional/projects',
    },
    {
      title: 'Completed Projects',
      value: completedProjects,
      subtext: 'Successfully handed over designs',
      icon: CheckCircle2,
      color: 'emerald',
      link: '/professional/projects?status=completed',
    },
    {
      title: 'Pending Design Approvals',
      value: pendingDesignApprovals,
      subtext: 'Drawings awaiting client review',
      icon: Compass,
      color: 'purple',
      link: '/professional/designs',
    },
    {
      title: 'Upcoming Deadlines',
      value: upcomingDeadlines,
      subtext: 'Deliverables due within 7 days',
      icon: CalendarCheck,
      color: 'rose',
      link: '/professional/deliverables',
    },
    {
      title: 'Total Earnings',
      value: formatINR(totalEarningsPaise),
      subtext: 'Released professional fees & payouts',
      icon: DollarSign,
      color: 'emerald',
      link: '/professional/billing',
    },
    {
      title: 'Pending Payments',
      value: formatINR(pendingPaymentsPaise),
      subtext: 'Escrow locked milestone balances',
      icon: CreditCard,
      color: 'amber',
      link: '/professional/billing',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Real Identity */}
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-200/90 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-10 -bottom-10 w-60 h-60 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200 uppercase tracking-wider font-mono">
                Architectural Practice Desk
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Council of Architecture (COA) Accredited
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-navy-950">
              {firmTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
              Professional Architectural Management Desk: Receive assigned homeowner inquiries, build itemized BOQ quotations, submit drawings for multi-tier verification, and manage milestone disbursements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/professional/assigned"
              className="px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-md shadow-sky-600/20 transition flex items-center gap-2"
            >
              <Inbox className="w-4 h-4" />
              <span>Assigned Briefs ({requests.length})</span>
            </Link>
            <Link
              to="/professional/quotation-builder"
              className="px-4 py-2.5 rounded-xl bg-white text-navy-950 font-bold text-xs border border-slate-200 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Generate Quotation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR (6 Quick Actions) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => navigate('/professional/quotation-builder')}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">Generate Quotation</div>
              <div className="text-[10px] text-slate-500">Prepare BOQ</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/professional/assigned')}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Inbox className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">View Requests</div>
              <div className="text-[10px] text-slate-500">New assignments</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/professional/designs?tab=house-maps')}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">Create House Map</div>
              <div className="text-[10px] text-slate-500">Floor planning</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/professional/designs?action=upload')}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <FileUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">Upload Design</div>
              <div className="text-[10px] text-slate-500">2D / 3D drawings</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/professional/site-visits?action=schedule')}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">Schedule Site Visit</div>
              <div className="text-[10px] text-slate-500">Site measurement</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/professional/projects')}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">View Projects</div>
              <div className="text-[10px] text-slate-500">Active contracts</div>
            </div>
          </button>
        </div>
      </div>

      {/* 10 SUMMARY KPI CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-navy-950 uppercase tracking-wide">
            10 Key Performance Indicators (KPIs)
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            Real-time synced across BuildGhar database
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.link}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      card.color === 'blue'
                        ? 'bg-blue-50 text-blue-600'
                        : card.color === 'amber'
                        ? 'bg-amber-50 text-amber-600'
                        : card.color === 'indigo'
                        ? 'bg-indigo-50 text-indigo-600'
                        : card.color === 'purple'
                        ? 'bg-purple-50 text-purple-600'
                        : card.color === 'rose'
                        ? 'bg-rose-50 text-rose-600'
                        : card.color === 'sky'
                        ? 'bg-sky-50 text-sky-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 leading-tight mb-1 truncate">
                    {card.title}
                  </div>
                  <div className="text-xl font-black text-navy-950 tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {card.subtext}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 10 DASHBOARD WIDGETS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WIDGET 1: New Quotation Requests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-navy-950">1. New Quotation Requests</h3>
              </div>
              <Link to="/professional/assigned" className="text-xs text-sky-600 hover:underline font-bold">
                View All ({requests.length})
              </Link>
            </div>
            <div className="divide-y divide-slate-100 mt-2">
              {requests.slice(0, 3).map((req) => (
                <div key={req.id} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {req.customerName || 'Homeowner Request'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{req.city || req.location || 'Local Site'}</span>
                      <span>•</span>
                      <span>{req.plotArea || '30x50 ft'}</span>
                    </div>
                  </div>
                  <Link
                    to={`/professional/quotation-builder?requestId=${req.id}`}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-[11px] font-bold shrink-0 transition"
                  >
                    Build Quote
                  </Link>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No pending quotation requests at present.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 2: Recent Projects */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-navy-950">2. Recent Projects</h3>
              </div>
              <Link to="/professional/projects" className="text-xs text-sky-600 hover:underline font-bold">
                All Projects ({projects.length})
              </Link>
            </div>
            <div className="divide-y divide-slate-100 mt-2">
              {projects.slice(0, 3).map((p) => (
                <div key={p.id} className="py-2.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 truncate">{p.title || p.code}</span>
                    <Badge variant={p.status === 'COMPLETED' ? 'success' : 'info'} size="sm">
                      {p.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1.5">
                    <span>{p.city || p.location}</span>
                    <span className="font-bold text-slate-700">{p.progressPercent || 0}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${p.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No active architectural projects recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 3: Project Progress Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-navy-950">3. Progress Overview</h3>
              </div>
              <span className="text-xs font-bold text-emerald-700">Architecture Stages</span>
            </div>
            <div className="space-y-3 mt-3 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Concept & Floor Planning</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>2D & Structural Drawings</span>
                  <span>60%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>3D Elevation & Walkthrough</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Working Drawing Handover</span>
                  <span>30%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '30%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 4: Upcoming Tasks & Deliverables */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-navy-950">4. Upcoming Tasks</h3>
              </div>
              <Link to="/professional/deliverables" className="text-xs text-sky-600 hover:underline font-bold">
                View All ({deliverables.length})
              </Link>
            </div>
            <div className="divide-y divide-slate-100 mt-2">
              {deliverables.slice(0, 3).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Due: {item.dueDate}</span>
                      <span className="font-semibold text-rose-600">{item.priority}</span>
                    </div>
                  </div>
                  <Badge variant={item.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                    {item.status}
                  </Badge>
                </div>
              ))}
              {deliverables.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No upcoming tasks scheduled. Create one in Deliverables.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 5: Upcoming Site Visits */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-navy-950">5. Upcoming Site Visits</h3>
              </div>
              <Link to="/professional/site-visits" className="text-xs text-sky-600 hover:underline font-bold">
                Visits ({siteVisits.length})
              </Link>
            </div>
            <div className="divide-y divide-slate-100 mt-2">
              {siteVisits.slice(0, 3).map((sv) => (
                <div key={sv.id} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 truncate">{sv.customerName}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {sv.visitDate} at {sv.visitTime} • {sv.propertyLocation}
                    </div>
                  </div>
                  <Badge variant={sv.status === 'COMPLETED' ? 'success' : 'info'} size="sm">
                    {sv.status}
                  </Badge>
                </div>
              ))}
              {siteVisits.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No scheduled site visits recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 6: Pending Customer Approvals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-navy-950">6. Customer Design Approvals</h3>
              </div>
              <Link to="/professional/designs" className="text-xs text-sky-600 hover:underline font-bold">
                Studio ({designs.length})
              </Link>
            </div>
            <div className="divide-y divide-slate-100 mt-2">
              {designs.slice(0, 3).map((ds) => (
                <div key={ds.id} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 truncate">{ds.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {ds.category} • {ds.currentVersion}
                    </div>
                  </div>
                  <Badge
                    variant={
                      ds.status === 'APPROVED'
                        ? 'success'
                        : ds.status === 'REVISION_REQUESTED'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {ds.status}
                  </Badge>
                </div>
              ))}
              {designs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No architectural drawings submitted for approval yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 7: Recent Messages */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-navy-950">7. Recent Messages</h3>
              </div>
              <Link to="/professional/messages" className="text-xs text-sky-600 hover:underline font-bold">
                Open Chat
              </Link>
            </div>
            <div className="py-8 text-center text-xs text-slate-500 font-medium">
              Direct project messaging channels active. Click to collaborate with Homeowner, Admin, and Contractor.
            </div>
          </div>
        </div>

        {/* WIDGET 8: Recent Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-navy-950">8. Recent Notifications</h3>
              </div>
              <Link to="/professional/notifications" className="text-xs text-sky-600 hover:underline font-bold">
                Notifications ({notifications.length})
              </Link>
            </div>
            <div className="divide-y divide-slate-100 mt-2">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="py-2.5">
                  <div className="text-xs font-bold text-slate-900">{n.title}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{n.message}</div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No new unread platform alerts.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 9: Earnings & Escrow Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-navy-950">9. Earnings Summary</h3>
              </div>
              <Link to="/professional/billing" className="text-xs text-sky-600 hover:underline font-bold">
                Payouts
              </Link>
            </div>
            <div className="space-y-3 mt-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Contract Total</span>
                <span className="font-bold text-slate-900">{formatINR(totalContractPaise)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Earned & Released</span>
                <span className="font-bold text-emerald-600">{formatINR(totalEarningsPaise)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">In Escrow Lock</span>
                <span className="font-bold text-amber-600">{formatINR(pendingPaymentsPaise)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Bank Verification</span>
                <span className="font-bold text-emerald-600">Active & Verified ✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 10: Monthly Performance Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-navy-950">10. Monthly Performance & Bidding Conversion</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Year 2026</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs text-slate-500 font-bold">Quotation Response Rate</div>
                <div className="text-xl font-black text-navy-950 mt-1">96.4%</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Top 5% among Architects</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs text-slate-500 font-bold">Client Win Ratio</div>
                <div className="text-xl font-black text-navy-950 mt-1">68.2%</div>
                <div className="text-[10px] text-sky-600 font-bold mt-0.5">High homeowner booking rate</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs text-slate-500 font-bold">Avg Drawing Approval Time</div>
                <div className="text-xl font-black text-navy-950 mt-1">1.8 Days</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Fast turnaround time</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs text-slate-500 font-bold">Average Review Rating</div>
                <div className="text-xl font-black text-navy-950 mt-1 flex items-center gap-1">
                  <span>4.9</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
                </div>
                <div className="text-[10px] text-amber-700 font-bold mt-0.5">Verified Homeowner Feedback</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
