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
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo.js';
import { SectionErrorBoundary } from '../common/SectionErrorBoundary.js';
import { useAuth } from '../../context/AuthContext.js';
import { getInteriorDesignerByPhone } from '../../data/interiorDesignerStore.js';

export const InteriorDesignerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // If not logged in as professional or interior designer
  if (!user || (user.role !== 'PROFESSIONAL' && (user.role as any) !== 'INTERIOR_DESIGNER')) {
    return <Navigate to="/interior-designer/login" replace />;
  }

  // Check account status in store
  const designer = user.phone ? getInteriorDesignerByPhone(user.phone) : null;
  if (designer) {
    if (designer.accountStatus === 'PROFILE_INCOMPLETE') {
      return <Navigate to="/interior-designer/profile-wizard" replace />;
    }
    if (
      designer.accountStatus === 'PENDING_APPROVAL' ||
      designer.accountStatus === 'UNDER_REVIEW' ||
      designer.accountStatus === 'DOCUMENTS_REQUIRED' ||
      designer.accountStatus === 'REJECTED' ||
      designer.accountStatus === 'SUSPENDED'
    ) {
      return <Navigate to="/interior-designer/application-status" replace />;
    }
  }

  // 14 Master Sidebar Groups (A-N from Section 5)
  const navItems = [
    { label: 'A. Dashboard', path: '/interior-designer/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'B. Quotation Management', path: '/interior-designer/quotations', icon: FileCheck2 },
    { label: 'C. Booking Management', path: '/interior-designer/bookings', icon: CalendarCheck },
    { label: 'D. Project Management', path: '/interior-designer/projects', icon: HardHat },
    { label: 'E. Design & 3D', path: '/interior-designer/designs', icon: Box },
    { label: 'F. Estimation & BOQ', path: '/interior-designer/boq', icon: Layers },
    { label: 'G. Site & Snag List', path: '/interior-designer/site-management', icon: Camera },
    { label: 'H. Client Management', path: '/interior-designer/clients', icon: Users },
    { label: 'I. Team & Vendors', path: '/interior-designer/team', icon: Briefcase },
    { label: 'J. Billing & Payments', path: '/interior-designer/billing', icon: CreditCard },
    { label: 'K. Reports & Analytics', path: '/interior-designer/reports', icon: BarChart3 },
    { label: 'L. Support Desk', path: '/interior-designer/support', icon: LifeBuoy },
    { label: 'M. Settings', path: '/interior-designer/settings', icon: Sliders },
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
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

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
