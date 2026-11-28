import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Palette,
  LayoutDashboard,
  FileText,
  FileCheck2,
  CalendarCheck,
  HardHat,
  Box,
  Layers,
  Camera,
  Users,
  Briefcase,
  CreditCard,
  BarChart3,
  LifeBuoy,
  Sliders,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Bell,
  ArrowRight,
  MessageSquare,
  CheckSquare,
  Star,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo.js';
import { SectionErrorBoundary } from '../common/SectionErrorBoundary.js';
import { useAuth } from '../../context/AuthContext.js';
import { getInteriorDesignerByPhone, getInteriorNotifications } from '../../data/interiorDesignerStore.js';

export const InteriorDesignerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // If not logged in as professional or interior designer
  if (!user || (user.role !== 'PROFESSIONAL' && (user.role as any) !== 'INTERIOR_DESIGNER')) {
    return <Navigate to="/interior-designer/login" replace />;
  }

  // Check account status in store - Strict Access Control (Section 4 & 20)
  const designer = user.phone ? getInteriorDesignerByPhone(user.phone) : null;
  if (designer) {
    if (designer.accountStatus === 'PROFILE_INCOMPLETE' || (designer.accountStatus as any) === 'DRAFT') {
      return <Navigate to="/interior-designer/profile-wizard" replace />;
    }
    if (designer.accountStatus !== 'APPROVED') {
      return <Navigate to="/interior-designer/application-status" replace />;
    }
  }

  const notifications = getInteriorNotifications(user.phone || 'id-101');
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const navItems = [
    { label: 'A. Dashboard', path: '/interior-designer/dashboard', icon: LayoutDashboard, exact: true },
    {
      label: '3. Quotation Management',
      path: '/interior-designer/quotations',
      icon: FileCheck2,
      subItems: [
        { label: 'New Quotation Requests', path: '/interior-designer/quotations?view=NEW_REQUESTS', view: 'NEW_REQUESTS' },
        { label: 'Assigned Requests', path: '/interior-designer/quotations?view=ASSIGNED_REQUESTS', view: 'ASSIGNED_REQUESTS' },
        { label: 'Accepted Assignments', path: '/interior-designer/quotations?view=ACCEPTED_ASSIGNMENTS', view: 'ACCEPTED_ASSIGNMENTS' },
        { label: 'Generate Quotation', path: '/interior-designer/quotations?view=GENERATE_QUOTATION', view: 'GENERATE_QUOTATION' },
        { label: 'Quotation List', path: '/interior-designer/quotations?view=QUOTATION_LIST', view: 'QUOTATION_LIST' },
        { label: 'Pending Admin Review', path: '/interior-designer/quotations?view=PENDING_ADMIN_REVIEW', view: 'PENDING_ADMIN_REVIEW' },
        { label: 'Approved Quotations', path: '/interior-designer/quotations?view=APPROVED_QUOTATIONS', view: 'APPROVED_QUOTATIONS' },
        { label: 'Rejected Quotations', path: '/interior-designer/quotations?view=REJECTED_QUOTATIONS', view: 'REJECTED_QUOTATIONS' },
        { label: 'Revision Required', path: '/interior-designer/quotations?view=REVISION_REQUIRED', view: 'REVISION_REQUIRED' },
        { label: 'Customer Accepted Quotations', path: '/interior-designer/quotations?view=CUSTOMER_ACCEPTED', view: 'CUSTOMER_ACCEPTED' },
        { label: 'Quotation History', path: '/interior-designer/quotations?view=QUOTATION_HISTORY', view: 'QUOTATION_HISTORY' },
      ],
    },
    { label: 'C. Booking Management', path: '/interior-designer/bookings', icon: CalendarCheck },
    {
      label: '4. Project Management',
      path: '/interior-designer/projects',
      icon: HardHat,
      subItems: [
        { label: 'My Projects', path: '/interior-designer/projects?view=MY_PROJECTS', view: 'MY_PROJECTS' },
        { label: 'New Project Assignments', path: '/interior-designer/projects?view=NEW_ASSIGNMENTS', view: 'NEW_ASSIGNMENTS' },
        { label: 'Project Overview', path: '/interior-designer/projects?view=PROJECT_OVERVIEW', view: 'PROJECT_OVERVIEW' },
        { label: 'Project Kickoff', path: '/interior-designer/projects?view=PROJECT_KICKOFF', view: 'PROJECT_KICKOFF' },
        { label: 'Project Planning', path: '/interior-designer/projects?view=PROJECT_PLANNING', view: 'PROJECT_PLANNING' },
        { label: 'Project Timeline', path: '/interior-designer/projects?view=PROJECT_TIMELINE', view: 'PROJECT_TIMELINE' },
        { label: 'Project Tasks', path: '/interior-designer/projects?view=PROJECT_TASKS', view: 'PROJECT_TASKS' },
        { label: 'Project Schedule', path: '/interior-designer/projects?view=PROJECT_SCHEDULE', view: 'PROJECT_SCHEDULE' },
        { label: 'Project Coordination', path: '/interior-designer/projects?view=PROJECT_COORDINATION', view: 'PROJECT_COORDINATION' },
        { label: 'Project Status', path: '/interior-designer/projects?view=PROJECT_STATUS', view: 'PROJECT_STATUS' },
        { label: 'Completed Projects', path: '/interior-designer/projects?view=COMPLETED_PROJECTS', view: 'COMPLETED_PROJECTS' },
        { label: 'On-Hold Projects', path: '/interior-designer/projects?view=ON_HOLD_PROJECTS', view: 'ON_HOLD_PROJECTS' },
      ],
    },
    {
      label: '5. Interior Design Management',
      path: '/interior-designer/designs',
      icon: Box,
      subItems: [
        { label: 'Design Briefs', path: '/interior-designer/designs?view=DESIGN_BRIEFS', view: 'DESIGN_BRIEFS' },
        { label: 'Space Planning', path: '/interior-designer/designs?view=SPACE_PLANNING', view: 'SPACE_PLANNING' },
        { label: '2D Layout Design', path: '/interior-designer/designs?view=LAYOUT_2D', view: 'LAYOUT_2D' },
        { label: '3D Interior Design', path: '/interior-designer/designs?view=VISUALIZATION_3D', view: 'VISUALIZATION_3D' },
        { label: 'Living Room Design', path: '/interior-designer/designs?view=LIVING_ROOM', view: 'LIVING_ROOM' },
        { label: 'Bedroom Design', path: '/interior-designer/designs?view=BEDROOM', view: 'BEDROOM' },
        { label: 'Kitchen Design', path: '/interior-designer/designs?view=KITCHEN', view: 'KITCHEN' },
        { label: 'Bathroom Design', path: '/interior-designer/designs?view=BATHROOM', view: 'BATHROOM' },
        { label: 'Furniture Layout', path: '/interior-designer/designs?view=FURNITURE_LAYOUT', view: 'FURNITURE_LAYOUT' },
        { label: 'Lighting Layout', path: '/interior-designer/designs?view=LIGHTING_LAYOUT', view: 'LIGHTING_LAYOUT' },
        { label: 'False Ceiling Design', path: '/interior-designer/designs?view=FALSE_CEILING', view: 'FALSE_CEILING' },
        { label: 'Material & Finish Selection', path: '/interior-designer/designs?view=MATERIAL_FINISHES', view: 'MATERIAL_FINISHES' },
        { label: 'Design Submissions', path: '/interior-designer/designs?view=DESIGN_SUBMISSIONS', view: 'DESIGN_SUBMISSIONS' },
        { label: 'Revision Requests', path: '/interior-designer/designs?view=REVISION_REQUESTS', view: 'REVISION_REQUESTS' },
        { label: 'Approved Designs', path: '/interior-designer/designs?view=APPROVED_DESIGNS', view: 'APPROVED_DESIGNS' },
        { label: 'Design Version History', path: '/interior-designer/designs?view=VERSION_HISTORY', view: 'VERSION_HISTORY' },
      ],
    },
    {
      label: '6. BOQ & Cost Estimation',
      path: '/interior-designer/boq',
      icon: Layers,
      subItems: [
        { label: 'Create BOQ', path: '/interior-designer/boq?view=CREATE_BOQ', view: 'CREATE_BOQ' },
        { label: 'Material List', path: '/interior-designer/boq?view=MATERIAL_LIST', view: 'MATERIAL_LIST' },
        { label: 'Quantity Estimation', path: '/interior-designer/boq?view=QUANTITY_ESTIMATION', view: 'QUANTITY_ESTIMATION' },
        { label: 'Cost Estimation', path: '/interior-designer/boq?view=COST_ESTIMATION', view: 'COST_ESTIMATION' },
        { label: 'Furniture Estimation', path: '/interior-designer/boq?view=FURNITURE_ESTIMATION', view: 'FURNITURE_ESTIMATION' },
        { label: 'Material Specifications', path: '/interior-designer/boq?view=MATERIAL_SPECIFICATIONS', view: 'MATERIAL_SPECIFICATIONS' },
        { label: 'BOQ Submission History', path: '/interior-designer/boq?view=SUBMISSION_HISTORY', view: 'SUBMISSION_HISTORY' },
      ],
    },
    {
      label: '7. Site Visit Management',
      path: '/interior-designer/site-management',
      icon: Camera,
      subItems: [
        { label: 'New Site Visit Requests', path: '/interior-designer/site-management?view=NEW_REQUESTS', view: 'NEW_REQUESTS' },
        { label: 'Upcoming Visits', path: '/interior-designer/site-management?view=UPCOMING_VISITS', view: 'UPCOMING_VISITS' },
        { label: 'Site Visit Calendar', path: '/interior-designer/site-management?view=VISIT_CALENDAR', view: 'VISIT_CALENDAR' },
        { label: 'Site Measurements', path: '/interior-designer/site-management?view=SITE_MEASUREMENTS', view: 'SITE_MEASUREMENTS' },
        { label: 'Site Visit Reports', path: '/interior-designer/site-management?view=VISIT_REPORTS', view: 'VISIT_REPORTS' },
        { label: 'Site Photos', path: '/interior-designer/site-management?view=SITE_PHOTOS', view: 'SITE_PHOTOS' },
        { label: 'Completed Visits', path: '/interior-designer/site-management?view=COMPLETED_VISITS', view: 'COMPLETED_VISITS' },
      ],
    },
    {
      label: '8. Project Execution & Coordination',
      path: '/interior-designer/execution',
      icon: Briefcase,
      subItems: [
        { label: 'Execution Planning', path: '/interior-designer/execution?view=EXECUTION_PLANNING', view: 'EXECUTION_PLANNING' },
        { label: 'Work Instructions', path: '/interior-designer/execution?view=WORK_INSTRUCTIONS', view: 'WORK_INSTRUCTIONS' },
        { label: 'Vendor Coordination', path: '/interior-designer/execution?view=VENDOR_COORDINATION', view: 'VENDOR_COORDINATION' },
        { label: 'Material Coordination', path: '/interior-designer/execution?view=MATERIAL_COORDINATION', view: 'MATERIAL_COORDINATION' },
        { label: 'Contractor Coordination', path: '/interior-designer/execution?view=CONTRACTOR_COORDINATION', view: 'CONTRACTOR_COORDINATION' },
        { label: 'Installation Schedule', path: '/interior-designer/execution?view=INSTALLATION_SCHEDULE', view: 'INSTALLATION_SCHEDULE' },
        { label: 'Work Inspection', path: '/interior-designer/execution?view=WORK_INSPECTION', view: 'WORK_INSPECTION' },
        { label: 'Site Progress Reports', path: '/interior-designer/execution?view=PROGRESS_REPORTS', view: 'PROGRESS_REPORTS' },
        { label: 'Issues & Delays', path: '/interior-designer/execution?view=ISSUES_DELAYS', view: 'ISSUES_DELAYS' },
      ],
    },
    {
      label: '9. Milestone & Deliverable Management',
      path: '/interior-designer/milestones',
      icon: CheckSquare,
      subItems: [
        { label: 'Project Milestones', path: '/interior-designer/milestones?view=PROJECT_MILESTONES', view: 'PROJECT_MILESTONES' },
        { label: 'Submit Deliverables', path: '/interior-designer/milestones?view=SUBMIT_DELIVERABLES', view: 'SUBMIT_DELIVERABLES' },
        { label: 'Milestone Submission', path: '/interior-designer/milestones?view=MILESTONE_SUBMISSION', view: 'MILESTONE_SUBMISSION' },
        { label: 'Pending Admin Review', path: '/interior-designer/milestones?view=PENDING_ADMIN_REVIEW', view: 'PENDING_ADMIN_REVIEW' },
        { label: 'Customer Approval Status', path: '/interior-designer/milestones?view=CUSTOMER_APPROVAL_STATUS', view: 'CUSTOMER_APPROVAL_STATUS' },
        { label: 'Revision Required', path: '/interior-designer/milestones?view=REVISION_REQUIRED', view: 'REVISION_REQUIRED' },
        { label: 'Approved Milestones', path: '/interior-designer/milestones?view=APPROVED_MILESTONES', view: 'APPROVED_MILESTONES' },
        { label: 'Completed Deliverables', path: '/interior-designer/milestones?view=COMPLETED_DELIVERABLES', view: 'COMPLETED_DELIVERABLES' },
      ],
    },
    { label: 'I. Client Management', path: '/interior-designer/clients', icon: Users },
    {
      label: '10. Communication Management',
      path: '/interior-designer/messages',
      icon: MessageSquare,
      subItems: [
        { label: 'Admin Messages', path: '/interior-designer/messages?view=ADMIN_MESSAGES', view: 'ADMIN_MESSAGES' },
        { label: 'Project Communication', path: '/interior-designer/messages?view=PROJECT_COMMUNICATION', view: 'PROJECT_COMMUNICATION' },
        { label: 'Customer Messages Routed Through Admin', path: '/interior-designer/messages?view=CUSTOMER_MESSAGES_ROUTED', view: 'CUSTOMER_MESSAGES_ROUTED' },
        { label: 'Architect Coordination', path: '/interior-designer/messages?view=ARCHITECT_COORDINATION', view: 'ARCHITECT_COORDINATION' },
        { label: 'Clarification Requests', path: '/interior-designer/messages?view=CLARIFICATION_REQUESTS', view: 'CLARIFICATION_REQUESTS' },
        { label: 'Message History', path: '/interior-designer/messages?view=MESSAGE_HISTORY', view: 'MESSAGE_HISTORY' },
      ],
    },
    { label: 'K. Team & Vendors', path: '/interior-designer/team', icon: Briefcase },
    { label: 'L. Billing & Payments', path: '/interior-designer/billing', icon: CreditCard },
    { label: 'M. Reports & Analytics', path: '/interior-designer/reports', icon: BarChart3 },
    { label: 'N. Support & Disputes', path: '/interior-designer/support', icon: LifeBuoy },
    { label: 'O. Notifications', path: '/interior-designer/notifications', icon: Bell },
    { label: 'P. Settings', path: '/interior-designer/settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* ---------------- TOP NAVBAR ---------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 border-b border-blue-200 shadow-xs h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-navy-950 hover:bg-blue-50 transition"
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            to="/interior-designer/dashboard"
            className="flex items-center gap-2.5 py-1 px-3 rounded-2xl bg-gradient-to-r from-blue-50/70 via-emerald-50/50 to-blue-50/70 border border-blue-200 shadow-2xs"
          >
            <BrandLogo size="sm" subtitle="Interior Design" />
            <span className="px-2.5 py-0.5 bg-blue-100 border border-blue-300 text-navy-950 font-mono text-[10px] font-black rounded-full uppercase tracking-wider hidden sm:inline-block">
              Design & Spatial Design
            </span>
          </Link>
        </div>

        {/* Right Action Utilities */}
        <div className="flex items-center gap-3">
          

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Partner</span>
          </div>

          {/* Notifications Bell */}
          <Link
            to="/interior-designer/notifications"
            className="relative p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition border border-slate-200 bg-white"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-mono text-[9px] font-black flex items-center justify-center">
                {unreadNotifs}
              </span>
            )}
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 pl-2.5 pr-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 transition shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                <Palette className="w-4 h-4" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-black text-slate-900 leading-tight max-w-[130px] truncate">
                  {user.name || designer?.name || 'Interior Designer'}
                </div>
                <div className="text-[10px] text-blue-700 font-mono font-bold">
                  {user.phone || ''}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs text-slate-800">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="font-black text-slate-900">{user.name || designer?.name}</div>
                  <div className="text-slate-500 text-[11px] font-mono">{user.phone}</div>
                  <div className="text-[10px] text-blue-700 font-bold mt-1">
                    {designer?.businessName || 'Interior Design Partner'}
                  </div>
                </div>

                <Link
                  to="/interior-designer/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-blue-50 font-semibold"
                >
                  Settings & Profile
                </Link>
                <Link
                  to="/interior-designer/billing"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-blue-50 font-semibold"
                >
                  Milestone Escrow Payouts
                </Link>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- MAIN LAYOUT CONTAINER ---------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-blue-100 shadow-sm flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-1 overflow-y-auto flex-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Workspace
            </div>
            {navItems.map((item: any) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = Boolean(expandedMenus[item.path]);

              if (hasSubItems) {
                return (
                  <div key={item.path} className="space-y-0.5">
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-blue-50 hover:text-navy-950 font-semibold'
                      }`}
                      onClick={() => {
                        setExpandedMenus((prev) => ({ ...prev, [item.path]: !prev[item.path] }));
                        if (!location.pathname.startsWith(item.path)) {
                          navigate(item.path);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-blue-600'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedMenus((prev) => ({ ...prev, [item.path]: !prev[item.path] }));
                        }}
                        className={`p-0.5 rounded-md hover:bg-white/20 transition ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        aria-label="Toggle Submenu"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Collapsible Submenu Dropdown */}
                    {isExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-blue-200 ml-4 animate-in fade-in duration-150">
                        {item.subItems.map((sub: any) => {
                          const currentViewParam = new URLSearchParams(location.search).get('view');
                          const isSubActive =
                            location.pathname.startsWith(item.path) &&
                            (currentViewParam === sub.view ||
                              (!currentViewParam &&
                                (sub.view === 'NEW_REQUESTS' ||
                                  sub.view === 'MY_PROJECTS' ||
                                  sub.view === 'DESIGN_BRIEFS' ||
                                  sub.view === 'CREATE_BOQ' ||
                                  sub.view === 'EXECUTION_PLANNING' ||
                                  sub.view === 'PROJECT_MILESTONES' ||
                                  sub.view === 'ADMIN_MESSAGES')));

                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition font-medium ${
                                isSubActive
                                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                  : 'text-slate-600 hover:text-blue-950 hover:bg-blue-100/60'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isSubActive ? 'bg-amber-300 scale-125' : 'bg-slate-300'
                                }`}
                              />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-navy-950'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>N. Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <SectionErrorBoundary sectionName="Design Studio" fallbackUrl="/interior-designer">
            <Outlet />
          </SectionErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
