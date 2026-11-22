import { ArchitectHeader } from '../navigation/ArchitectHeader.js';
import { InteriorDesignerHeader } from '../navigation/InteriorDesignerHeader.js';
import { VendorHeader } from '../navigation/VendorHeader.js';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { BrandLogo } from './BrandLogo.js';
import {
  Menu,
  X,
  ArrowRight,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Home,
  FileText,
  FileCheck2,
  ShoppingBag,
  Sliders,
  CalendarCheck,
  CreditCard,
  Layers,
  Sparkles,
  LayoutGrid,
  Crown,
  User,
  LogIn,
  Briefcase,
  Compass,
  Palette,
} from 'lucide-react';
export const Header: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [partnersDropdownOpen, setPartnersDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const partnersDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (partnersDropdownRef.current && !partnersDropdownRef.current.contains(event.target as Node)) {
        setPartnersDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setPartnersDropdownOpen(false);
  }, [location.pathname]);
  const isArchitectRoute =
    location.pathname === '/architect' ||
    location.pathname === '/architects' ||
    location.pathname.startsWith('/architect/');
  const isInteriorRoute =
    location.pathname === '/interior-designer' ||
    location.pathname === '/interior-designers' ||
    location.pathname === '/interior-design' ||
    location.pathname.startsWith('/interior-designer/') ||
    location.pathname.startsWith('/interior-design/');
  const isVendorRoute =
    location.pathname === '/vendor' ||
    location.pathname === '/vendor-partner' ||
    location.pathname === '/vendor/partner' ||
    location.pathname === '/vendors' ||
    location.pathname.startsWith('/vendor/') ||
    location.pathname === '/vendor-register';
  if (isArchitectRoute) {
    return <ArchitectHeader />;
  }
  if (isInteriorRoute) {
    return <InteriorDesignerHeader />;
  }
  if (isVendorRoute) {
    return <VendorHeader />;
  }
  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'PROFESSIONAL') return '/professional';
    if (user.role === 'VENDOR') return '/vendor';
    return '/dashboard';
  };

  // Public frontend only displays customer (homeowner) accounts.
  // Architect, Vendor and Admin partner sessions should never take over the main public consumer website header.
  const showFrontendUser = Boolean(user && user.role === 'CUSTOMER');
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Building Materials', path: '/materials' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];
  return (
    <header className="sticky top-0 z-50 bg-white/88 backdrop-blur-2xl border-b border-blue-100/90 shadow-[0_4px_30px_rgba(20,50,110,0.06)] transition-all relative">
      {/* Top Luminous Ambient Shining Edge */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/80 via-sky-400/60 to-transparent pointer-events-none" />
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-20 sm:h-22 flex items-center justify-between gap-4">
        {/* Brand Logo Section - Positioned Elegantly on the Side */}
        <Link
          to="/"
          className="group shrink-0 flex items-center justify-center transition-transform hover:opacity-95"
        >
          <BrandLogo size="md" />
        </Link>
        {/* Desktop Navigation Links - Modern Minimalist SaaS Style with Floating Pill */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 p-1 rounded-full bg-slate-50/80 border border-slate-200/70 shadow-2xs backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative py-2 px-3 xl:px-3.5 rounded-full text-[13px] xl:text-[13.5px] font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'text-navy-950 font-bold'
                    : 'text-slate-600 hover:text-navy-950 hover:bg-white/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 bg-white border border-slate-200/90 rounded-full shadow-xs z-[-1]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
          {/* For Partners Dropdown (Professional & Vendor) */}
          <div className="relative" ref={partnersDropdownRef}>
            <button
              onClick={() => setPartnersDropdownOpen(!partnersDropdownOpen)}
              onMouseEnter={() => setPartnersDropdownOpen(true)}
              className={`py-2 px-3 xl:px-3.5 rounded-full text-[13px] xl:text-[13.5px] font-semibold transition-colors duration-200 flex items-center gap-1.5 ${
                partnersDropdownOpen ||
                location.pathname.startsWith('/vendor') ||
                location.pathname.startsWith('/architect') ||
                location.pathname.startsWith('/interior-designer')
                  ? 'text-navy-950 bg-amber-50/90 border border-amber-300/70 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-navy-950 hover:bg-white/80'
              }`}
            >
              <span>For Partners</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                  partnersDropdownOpen ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </button>
            {/* Dropdown Menu */}
            {partnersDropdownOpen && (
              <div
                onMouseLeave={() => setPartnersDropdownOpen(false)}
                className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-display"
              >
                <div className="p-2 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Associate Partner Network
                </div>
                <div className="space-y-1 pt-1">
                  {/* 0. Architect & Engineering Firm */}
                  <Link
                    to="/architect"
                    onClick={() => setPartnersDropdownOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-sky-50 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-sky-700 flex items-center justify-between">
                        <span>Architect & Engineering Partner</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        COA verified network, landowner RFQs & 100% escrow milestones
                      </p>
                    </div>
                  </Link>
                  {/* 0. Interior Designer & Spatial Design */}
                  <Link
                    to="/interior-designer"
                    onClick={() => setPartnersDropdownOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-teal-50 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-teal-700 flex items-center justify-between">
                        <span>Interior Designer & Spatial Design</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        3D photorealistic renders, itemized BOQ & 100% escrow milestones
                      </p>
                    </div>
                  </Link>
                  {/* 2. Vendor / Supplier */}
                  <Link
                    to="/vendor"
                    onClick={() => setPartnersDropdownOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                        <span>Vendor & Material Supplier</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Vendor depot, manage cement/steel supply & site deliveries
                      </p>
                    </div>
                  </Link>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 px-3 py-1 flex items-center justify-between text-[11px]">
                  <Link
                    to="/architect/register"
                    onClick={() => setPartnersDropdownOpen(false)}
                    className="text-sky-700 hover:text-sky-800 font-bold hover:underline"
                  >
                    Architect Register →
                  </Link>
                  <Link
                    to="/interior-designer/register"
                    onClick={() => setPartnersDropdownOpen(false)}
                    className="text-teal-700 hover:text-teal-800 font-bold hover:underline"
                  >
                    Designer Register &rarr;
                  </Link>
                  <Link
                    to="/vendor/register"
                    onClick={() => setPartnersDropdownOpen(false)}
                    className="text-amber-700 hover:text-amber-800 font-bold hover:underline"
                  >
                    Vendor Register →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>
        {/* Right Action CTAs */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Desktop Auth Links */}
          <div className="hidden md:flex items-center gap-2.5">
            {!showFrontendUser ? (
              <Link
                to="/login"
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 border border-amber-500/35 hover:border-amber-400 transition shadow-sm hover:shadow-md hover:shadow-amber-500/10 flex items-center gap-1.5"
              >
                <span>Sign In</span>
              </Link>
            ) : (
            /* Logged In User Profile Pill */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-3 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition shadow-xs"
              >
                <div className="text-left font-display">
                  <div className="text-xs font-bold text-slate-900 leading-tight max-w-[130px] truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {user?.role === 'ADMIN' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5 text-purple-700" />
                        Admin
                      </span>
                    ) : user?.role === 'PROFESSIONAL' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                        Partner
                      </span>
                    ) : user?.role === 'VENDOR' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        Vendor
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Customer
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-navy-950 text-gold-400 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'GD'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 font-display">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{user?.name || 'User'}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{user?.phone || user?.email || ''}</div>
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        user?.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-900'
                          : user?.role === 'PROFESSIONAL'
                          ? 'bg-blue-100 text-blue-900'
                          : user?.role === 'VENDOR'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {user?.role === 'ADMIN' && <Crown className="w-3 h-3 text-purple-700 shrink-0" />}
                        Current: {user?.role === 'ADMIN' ? 'Super Admin' : user?.role === 'PROFESSIONAL' ? 'Professional Workspace' : user?.role === 'VENDOR' ? 'Vendor Depot' : 'Homeowner / Customer'}
                      </span>
                    </div>
                  </div>
                  {/* Primary Workspace Link */}
                  <div className="p-2 border-b border-slate-100">
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 bg-navy-950 text-gold-400 hover:bg-navy-900 rounded-xl font-bold transition shadow-xs"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gold-400" />
                      <span>
                        Go to {user?.role === 'ADMIN' ? 'Admin Center' : user?.role === 'PROFESSIONAL' ? 'Architect Panel' : user?.role === 'VENDOR' ? 'Vendor Depot' : 'My Dashboard'}
                      </span>
                    </Link>
                  </div>
                  {/* Role-Specific Feature Links - Isolated per user type */}
                  <div className="py-1 border-b border-slate-100 font-display">
                    {user?.role === 'ADMIN' ? (
                      <>
                        <Link
                          to="/admin/customers"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Customer Records</span>
                        </Link>
                        <Link
                          to="/admin/vendors"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Store className="w-3.5 h-3.5 text-amber-600" />
                          <span>Vendor Approvals</span>
                        </Link>
                        <Link
                          to="/admin/requests"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Requests & BOQs</span>
                        </Link>
                        <Link
                          to="/admin/materials"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Material Orders</span>
                        </Link>
                      </>
                    ) : user?.role === 'PROFESSIONAL' ? (
                      <>
                        <Link
                          to="/professional/assigned"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Assigned Client Requests</span>
                        </Link>
                        <Link
                          to="/professional/quotation-builder"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Sliders className="w-3.5 h-3.5 text-gold-600" />
                          <span>Quotation Builder (BOQ)</span>
                        </Link>
                        <Link
                          to="/professional/quotations"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Submitted Quotes</span>
                        </Link>
                        <Link
                          to="/professional/bookings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Site Visits & Bookings</span>
                        </Link>
                      </>
                    ) : user?.role === 'VENDOR' ? (
                      <>
                        <Link
                          to="/vendor/products"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                          <span>Products & Inventory</span>
                        </Link>
                        <Link
                          to="/vendor/orders"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Customer Orders</span>
                        </Link>
                        <Link
                          to="/vendor/delivery"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Delivery & Logistics</span>
                        </Link>
                        <Link
                          to="/vendor/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Sliders className="w-3.5 h-3.5 text-slate-500" />
                          <span>Depot Settings</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/dashboard/requests"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>My Construction Requests</span>
                        </Link>
                        <Link
                          to="/dashboard/quotations"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>My Quotations</span>
                        </Link>
                        <Link
                          to="/dashboard/track-service"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Track Live Construction</span>
                        </Link>
                        <Link
                          to="/dashboard/material-purchases"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                          <span>Material Purchases</span>
                        </Link>
                        <Link
                          to="/dashboard/invoices"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                          <span>Invoices & Escrow</span>
                        </Link>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                      window.location.href = '/';
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
          {/* Mobile menu trigger & actions */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            {showFrontendUser && (
              <Link
                to={getDashboardPath()}
                className="w-8 h-8 rounded-full bg-navy-950 text-gold-400 flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'GD'}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white/80 text-slate-700 hover:text-navy-950 hover:bg-white flex items-center justify-center shadow-2xs transition active:scale-95 ml-0.5 shrink-0"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Drawer (Attractive Solid & Clear Aesthetic) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-slate-200 bg-white px-5 pt-3 pb-6 space-y-3 shadow-2xl">
          <nav className="space-y-1 font-display">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 text-navy-950 font-black border border-amber-300 shadow-xs'
                      : 'text-slate-800 hover:text-navy-950 hover:bg-slate-100 font-bold'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {/* Mobile For Partners Section */}
          <div className="pt-2 border-t border-slate-100 font-display">
            <div className="px-1 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              For Partners
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Link
                to="/architect"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-sky-200 bg-sky-50/80 hover:bg-sky-100 text-slate-800 transition"
              >
                <Compass className="w-4 h-4 text-sky-600 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">Architect</div>
                  <div className="text-[10px] text-slate-500">Design Center</div>
                </div>
              </Link>
              <Link
                to="/interior-designer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100 text-slate-800 transition"
              >
                <Palette className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">Designer</div>
                  <div className="text-[10px] text-slate-500">Interior Design</div>
                </div>
              </Link>
              <Link
                to="/vendor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition"
              >
                <Store className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">Vendor</div>
                  <div className="text-[10px] text-slate-500">Depot Portal</div>
                </div>
              </Link>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 font-display">
            {!showFrontendUser ? (
              <>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-gold w-full text-xs py-3 text-center font-black rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Register Customer Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-xs py-2.5 text-center font-bold rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50"
                >
                  Login with Mobile OTP
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-gold w-full text-xs py-2.5 text-center font-black rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to My Workspace</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    window.location.href = '/';
                  }}
                  className="w-full text-xs py-2.5 text-center font-bold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Sign Out {user?.name ? `(${user.name})` : ''}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
