import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { BrandLogo } from '../common/BrandLogo.js';
import { SectionErrorBoundary } from '../common/SectionErrorBoundary.js';
import {
  LayoutDashboard,
  FileCheck2,
  CalendarCheck,
  Package,
  Receipt,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  Menu,
  X,
  PlusCircle,
  Truck,
  CreditCard,
  FileText,
  Scale,
  ShieldCheck,
  UserCheck,
  Users,
  Building,
  CheckCircle2,
  FolderOpen,
  Eye,
  Sliders,
  History,
  Layers,
  ShoppingBag,
  Calculator,
  Building2,
  HardHat,
  Clock,
  Key,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  Palette,
  MapPin,
  Sparkles,
  Briefcase,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout, cartCount, switchDemoRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable sub-menu open states (Spec Part 1: Collapsible Sidebar)
  const [quotationMenuOpen, setQuotationMenuOpen] = useState(true);
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(true);
  const [projectPaymentsMenuOpen, setProjectPaymentsMenuOpen] = useState(false);
  const [bookingMenuOpen, setBookingMenuOpen] = useState(false);
  const [materialMenuOpen, setMaterialMenuOpen] = useState(false);
  const [designDocsMenuOpen, setDesignDocsMenuOpen] = useState(false);
  const [billingMenuOpen, setBillingMenuOpen] = useState(false);
  const [communicationMenuOpen, setCommunicationMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  const isCreateRequest = location.pathname.includes('create-request') || location.pathname.includes('request-quotation');
  const isRequestsView = location.pathname.includes('/requests');

  // 1. Auth Gate: Unauthenticated users MUST log in first, except when filling quotation inquiry
  if (!user && !isCreateRequest) {
    return <Navigate to="/login?role=customer" replace state={{ from: location }} />;
  }

  // 2. Role Separation: Allow seamless testing of quotation request creation
  if (user?.role === 'PROFESSIONAL' && !isCreateRequest && !isRequestsView) {
    return <Navigate to="/professional" replace />;
  }
  if (user?.role === 'VENDOR' && !isCreateRequest && !isRequestsView) {
    return <Navigate to="/vendor" replace />;
  }
  // Super Admin permitted to inspect customer workspace

  const role = user?.role || 'CUSTOMER';

  // Compute dynamic breadcrumbs from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    calculator: 'Cost & Material Estimator',
    'cost-calculator': 'Cost & Material Estimator',
    'create-request': 'Get New Quotation',
    quotations: 'My Quotations',
    'accepted-quotations': 'Accepted Quotations',
    projects: 'My Projects',
    kickoff: 'Start Work / Kickoff',
    'project-payments': 'Project Payments & Milestones',
    'book-services': 'Book Services',
    bookings: 'Booking List',
    'track-service': 'Track Service',
    materials: 'Buy Materials',
    'material-purchases': 'My Purchase',
    payments: 'My Payments',
    invoices: 'Invoices',
    'final-settlements': 'Final Settlements',
    reports: 'Reports & Analytics',
    settings: 'Profile Settings',
    'saved-addresses': 'Saved Addresses & Properties',
    security: 'Account Security',
    'notification-preferences': 'Notification Preferences',
    help: 'Help & Support',
    notifications: 'Notifications',
    'design-approvals': 'Design Approvals',
    documents: 'Project Documents',
    reviews: 'Reviews & Feedback',
    professional: 'Pro Workspace',
    admin: 'Admin Center',
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('cement') || q.includes('steel') || q.includes('material') || q.includes('tile')) {
      navigate('/dashboard/materials');
    } else if (q.includes('quote') || q.includes('quotation')) {
      navigate('/dashboard/quotations');
    } else if (q.includes('track') || q.includes('progress') || q.includes('stage')) {
      navigate('/dashboard/track-service');
    } else if (q.includes('invoice') || q.includes('bill') || q.includes('gst')) {
      navigate('/dashboard/invoices');
    } else if (q.includes('pay') || q.includes('receipt')) {
      navigate('/dashboard/payments');
    } else if (q.includes('settle')) {
      navigate('/dashboard/final-settlements');
    } else if (q.includes('book') || q.includes('appointment')) {
      navigate('/dashboard/bookings');
    } else {
      navigate('/dashboard/quotations');
    }
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Super Admin Notice Bar if viewing customer workspace */}
      {user?.role === 'ADMIN' && (
        <div className="bg-purple-900 text-purple-100 text-xs px-4 py-2 flex items-center justify-between font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-700 text-gold-300 font-bold text-[10px] uppercase">
              Admin Mode
            </span>
            <span>You are viewing the Customer Dashboard as Super Administrator.</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gold-300 hover:text-white font-bold underline">
              Return to Admin Center →
            </Link>
          </div>
        </div>
      )}

      {/* ---------------- TOP NAVBAR ---------------- */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Drawer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 transition-transform hover:opacity-95"
          >
            <BrandLogo size="sm" subtitle="Customer Desk" />
            <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-950 font-mono text-[10px] font-black rounded-full uppercase tracking-wider hidden sm:inline-block shadow-2xs">
              Homeowner Project Desk
            </span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quotations, projects, materials, invoices..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 focus:bg-white transition"
            />
          </div>
        </form>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          <Link
            to="/dashboard/materials"
            className="p-2 rounded-lg text-slate-600 hover:text-navy-950 hover:bg-slate-100 relative transition"
            title="Material Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gold-500 text-white font-bold text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Notification Bell */}
          <Link
            to="/dashboard/notifications"
            className="p-2 rounded-lg text-slate-600 hover:text-navy-950 hover:bg-slate-100 relative transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </Link>

          <Link
            to="/professional"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition shadow-2xs"
            title="Launch Architect Workspace"
          >
            <Briefcase className="w-3.5 h-3.5 text-sky-600" />
            <span>Architect Panel</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />

          {/* Customer Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.name ? user?.name?.slice(0, 2).toUpperCase() : 'GD'}
              </div>
              <div className="hidden sm:block text-xs">
                <div className="font-semibold text-slate-800 leading-tight">{user?.name || 'Homeowner'}</div>
                <div className="text-[10px] text-slate-500">{user?.phone || ''}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-semibold text-slate-900">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email || 'Homeowner Account'}</div>
                </div>
                <Link
                  to="/dashboard/settings"
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Profile Settings</span>
                </Link>
                <Link
                  to="/dashboard/security"
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Account Security</span>
                </Link>
                <Link
                  to="/dashboard/help"
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Help & Support</span>
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <div className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Switch Desk
                </div>
                <Link
                  to="/professional"
                  className="flex items-center gap-2.5 px-4 py-2 text-sky-700 hover:bg-sky-50 font-bold"
                >
                  <Briefcase className="w-4 h-4 text-sky-600" />
                  <span>Architect Workspace</span>
                </Link>
                <Link
                  to="/admin"
                  className="flex items-center gap-2.5 px-4 py-2 text-purple-700 hover:bg-purple-50 font-bold"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin Desk</span>
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- MAIN WORKSPACE BODY ---------------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ---------------- 10-SECTION SIDEBAR NAVIGATION ---------------- */}
        <aside
          className={`fixed inset-y-16 left-0 z-20 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between shadow-sm lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-3.5 space-y-1 overflow-y-auto max-h-[calc(100vh-8.5rem)] text-xs">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-lg flex items-center justify-between mb-2">
              <span>Homeowner Menu</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

                {/* 1. Dashboard */}
                <div className="space-y-0.5">
                  <Link
                    to="/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                      location.pathname === '/dashboard' && !location.search
                        ? 'bg-navy-950 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className={`w-4 h-4 ${location.pathname === '/dashboard' && !location.search ? 'text-gold-400' : 'text-slate-400'}`} />
                    <span className="flex-1">1. Dashboard</span>
                  </Link>

                  {/* Smart Cost & Material Estimator Tool */}
                  <Link
                    to="/dashboard/calculator"
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                      location.pathname === '/dashboard/calculator'
                        ? 'bg-navy-950 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Calculator className={`w-4 h-4 ${location.pathname === '/dashboard/calculator' ? 'text-gold-400' : 'text-slate-400'}`} />
                    <span className="flex-1">Cost & Material Estimator</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gold-500/20 text-gold-700 border border-gold-300">
                      Smart
                    </span>
                  </Link>
                </div>

                {/* 2. Quotation Management */}
                <div className="pt-1">
                  <button
                    onClick={() => setQuotationMenuOpen(!quotationMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck2 className="w-4 h-4 text-slate-400" />
                      <span>2. Quotation Management</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        quotationMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {quotationMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/create-request"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/create-request'
                            ? 'bg-gold-50 text-gold-900 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>2.1 Get New Quotation</span>
                        <PlusCircle className="w-3.5 h-3.5 text-gold-600" />
                      </Link>
                      <Link
                        to="/dashboard/quotations"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/quotations' && !location.pathname.includes('/compare')
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        2.2 My Quotations
                      </Link>
                      <Link
                        to="/dashboard/quotations/compare"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname.includes('/compare')
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        2.3 Compare Quotations
                      </Link>
                      <Link
                        to="/dashboard/quotations?tab=history"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.search.includes('history')
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        2.4 Quotation History
                      </Link>
                    </div>
                  )}
                </div>

                {/* 3. My Projects (Spec Master Prompt) */}
                <div className="pt-1">
                  <button
                    onClick={() => setProjectsMenuOpen(!projectsMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-navy-950">3. My Projects</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        projectsMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {projectsMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/projects"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/projects'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        3.1 All Projects
                      </Link>
                      <Link
                        to="/dashboard/projects/kickoff"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname.includes('/kickoff')
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        3.2 Project Kickoff
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=overview"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.3 Project Overview
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=work-plan"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.4 Work Plan & Timeline
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=progress"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.5 Work Progress Tracking
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=daily-reports"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.6 Daily Site Reports
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=tasks"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.7 Task Management
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=milestones"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.8 Milestone Management
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=drawings"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.9 Design & Work Approvals
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=issues"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.10 Issues & Complaints
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=documents"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.11 Project Documents
                      </Link>
                      <Link
                        to="/dashboard/projects/active?tab=handover"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        3.12 Final Inspection & Handover
                      </Link>
                    </div>
                  )}
                </div>

                {/* 4. Project Payments & Milestones */}
                <div className="pt-1">
                  <button
                    onClick={() => setProjectPaymentsMenuOpen(!projectPaymentsMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>4. Payments & Milestones</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        projectPaymentsMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {projectPaymentsMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/project-payments?tab=schedule"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        4.1 Payment Schedule
                      </Link>
                      <Link
                        to="/dashboard/project-payments?tab=approvals"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        4.2 Pending Milestone Approvals
                      </Link>
                      <Link
                        to="/dashboard/project-payments?tab=due"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        4.3 Payments Due
                      </Link>
                      <Link
                        to="/dashboard/project-payments?tab=history"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        4.4 Payment History
                      </Link>
                      <Link
                        to="/dashboard/project-payments?tab=payouts"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        4.5 Contractor Payout Status
                      </Link>
                      <Link
                        to="/dashboard/project-payments?tab=settlement"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        4.6 Final Settlement
                      </Link>
                    </div>
                  )}
                </div>

                {/* 5. Booking Management */}
                <div className="pt-1">
                  <button
                    onClick={() => setBookingMenuOpen(!bookingMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="w-4 h-4 text-slate-400" />
                      <span>5. Booking Management</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        bookingMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {bookingMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/book-services"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/book-services'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        5.1 Book Services
                      </Link>
                      <Link
                        to="/dashboard/bookings"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/bookings'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        5.2 Booking List
                      </Link>
                      <Link
                        to="/dashboard/bookings?tab=visits"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        5.3 Site Visits & Appointments
                      </Link>
                      <Link
                        to="/dashboard/bookings?tab=professionals"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        5.4 Professional Details
                      </Link>
                    </div>
                  )}
                </div>

                {/* 6. Material Management (Full E-Commerce) */}
                <div className="pt-1">
                  <button
                    onClick={() => setMaterialMenuOpen(!materialMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>6. Material Management</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        materialMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {materialMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/materials"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/materials'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        6.1 Buy Materials (Store)
                      </Link>
                      <Link
                        to="/dashboard/materials"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        6.2 Shopping Cart
                      </Link>
                      <Link
                        to="/dashboard/material-purchases"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/material-purchases'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        6.4 My Purchase
                      </Link>
                      <Link
                        to="/dashboard/material-purchases?tab=tracking"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        6.5 Delivery Tracking
                      </Link>
                      <Link
                        to="/dashboard/material-purchases?tab=refunds"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        6.6 Return & Refund
                      </Link>
                      <Link
                        to="/dashboard/materials?tab=saved"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        6.7 Saved Products
                      </Link>
                    </div>
                  )}
                </div>

                {/* 7. Design & Documents */}
                <div className="pt-1">
                  <button
                    onClick={() => setDesignDocsMenuOpen(!designDocsMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="w-4 h-4 text-slate-400" />
                      <span>7. Design & Documents</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        designDocsMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {designDocsMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/documents?category=architectural"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        7.1 Architectural Design
                      </Link>
                      <Link
                        to="/dashboard/documents?category=interior"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        7.2 Interior Design
                      </Link>
                      <Link
                        to="/dashboard/design-approvals"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        7.3 Design Approval
                      </Link>
                      <Link
                        to="/dashboard/documents"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        7.4 Documents & Contracts
                      </Link>
                    </div>
                  )}
                </div>

                {/* 8. Billing & Payments (Financial Records) */}
                <div className="pt-1">
                  <button
                    onClick={() => setBillingMenuOpen(!billingMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="w-4 h-4 text-slate-400" />
                      <span>8. Billing & Payments</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        billingMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {billingMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/payments"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/payments'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        My Payments
                      </Link>
                      <Link
                        to="/dashboard/invoices"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/invoices'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Invoices & Tax Invoices
                      </Link>
                      <Link
                        to="/dashboard/payments?tab=receipts"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        Receipts & Records
                      </Link>
                      <Link
                        to="/dashboard/payments?tab=refunds"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        Refunds & Escrow
                      </Link>
                      <Link
                        to="/dashboard/payments?tab=dues"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        Outstanding Dues
                      </Link>
                      <Link
                        to="/dashboard/final-settlements"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/final-settlements'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Final Settlements
                      </Link>
                    </div>
                  )}
                </div>

                {/* 9. Communication & Support */}
                <div className="pt-1">
                  <button
                    onClick={() => setCommunicationMenuOpen(!communicationMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>9. Communication & Support</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        communicationMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {communicationMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/projects/active?tab=messages"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        9.1 Messages
                      </Link>
                      <Link
                        to="/dashboard/help?tab=tickets"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        9.2 Support Tickets
                      </Link>
                      <Link
                        to="/dashboard/help?tab=complaints"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        9.3 Complaints & Disputes
                      </Link>
                      <Link
                        to="/dashboard/help?tab=faqs"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        9.4 Help Center & FAQs
                      </Link>
                    </div>
                  )}
                </div>

                {/* 10. Reports & Analytics */}
                <Link
                  to="/dashboard/reports"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    location.pathname === '/dashboard/reports'
                      ? 'bg-navy-950 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className={`w-4 h-4 ${location.pathname === '/dashboard/reports' ? 'text-gold-400' : 'text-slate-400'}`} />
                  <span className="flex-1">10. Reports & Analytics</span>
                </Link>

                {/* 11. Notifications */}
                <Link
                  to="/dashboard/notifications"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    location.pathname === '/dashboard/notifications'
                      ? 'bg-navy-950 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bell className={`w-4 h-4 ${location.pathname === '/dashboard/notifications' ? 'text-gold-400' : 'text-slate-400'}`} />
                    <span>11. Notifications</span>
                  </div>
                </Link>

                {/* 12. Settings */}
                <div className="pt-1">
                  <button
                    onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>12. Settings</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${
                        settingsMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {settingsMenuOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/settings' && !location.search
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        12.1 Profile Settings
                      </Link>
                      <Link
                        to="/dashboard/saved-addresses"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/saved-addresses'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        12.2 Address Management
                      </Link>
                      <Link
                        to="/dashboard/security"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/security'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        12.3 Account Security
                      </Link>
                      <Link
                        to="/dashboard/notification-preferences"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-md transition ${
                          location.pathname === '/dashboard/notification-preferences'
                            ? 'bg-navy-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        12.4 Preferences
                      </Link>
                      <Link
                        to="/dashboard/settings?tab=account"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 transition"
                      >
                        12.5 Account Management
                      </Link>
                    </div>
                  )}
                </div>

            {/* Logout (Universal) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out / Logout</span>
              </button>
            </div>
          </div>

          {/* Quick Support Badge */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs text-xs">
              <div className="flex items-center gap-1.5 text-navy-950 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold-600" />
                <span>Customer Desk</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dedicated Project Manager</div>
              <div className="text-[11px] font-semibold text-gold-700 mt-1">1800-GHAR-DSG</div>
            </div>
          </div>
        </aside>

        {/* ---------------- MAIN CONTENT AREA ---------------- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 overflow-x-auto whitespace-nowrap">
            <Link to="/dashboard" className="hover:text-navy-900 transition">
              Home
            </Link>
            {pathSegments.map((segment, idx) => {
              const url = `/${pathSegments.slice(0, idx + 1).join('/')}`;
              const label = breadcrumbLabels[segment] || segment;
              const isLast = idx === pathSegments.length - 1;
              return (
                <React.Fragment key={url}>
                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  {isLast ? (
                    <span className="font-semibold text-slate-800">{label}</span>
                  ) : (
                    <Link to={url} className="hover:text-navy-900 transition">
                      {label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <SectionErrorBoundary sectionName="Customer Workspace" fallbackUrl="/dashboard">
            <Outlet />
          </SectionErrorBoundary>
        </main>
      </div>
    </div>
  );
};

