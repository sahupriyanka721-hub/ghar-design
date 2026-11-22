import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo } from '../common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Compass,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Palette,
  Store,
  Layers,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  LayoutDashboard,
  UserCheck,
  FileText,
  LogOut,
  ArrowRight,
} from 'lucide-react';

export const ArchitectHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [partnerSwitcherOpen, setPartnerSwitcherOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setPartnerSwitcherOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setPartnerSwitcherOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname, location.hash]);

  // Resolve active architect partner session
  const proUser = (user && user.role === 'PROFESSIONAL') ? user : (() => {
    try {
      const raw = localStorage.getItem('gd_pro_user') || localStorage.getItem('pro_user');
      if (raw) return JSON.parse(raw);
      const legacy = localStorage.getItem('user');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed.role === 'PROFESSIONAL') return parsed;
      }
    } catch {}
    return null;
  })();

  const handleArchitectLogout = () => {
    try {
      localStorage.removeItem('gd_pro_user');
      localStorage.removeItem('gd_pro_token');
      localStorage.removeItem('pro_user');
      localStorage.removeItem('pro_token');
      const legacy = localStorage.getItem('user');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed.role === 'PROFESSIONAL') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch {}
    logout();
    navigate('/architect');
    window.location.reload();
  };

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const isCurrentPage =
      location.pathname === '/architect' ||
      location.pathname === '/architects' ||
      location.pathname === '/architect-engineer';

    const executeScroll = () => {
      if (sectionId === 'overview') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
          window.history.pushState(null, '', '/architect');
        } catch (_) {}
        return;
      }

      const el = document.getElementById(sectionId);
      if (el) {
        const headerOffset = 76;
        const targetPos = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, targetPos), behavior: 'smooth' });
        try {
          window.history.pushState(null, '', `/architect#${sectionId}`);
        } catch (_) {}
      }
    };

    if (isCurrentPage) {
      executeScroll();
    } else {
      navigate(`/architect#${sectionId}`);
      setTimeout(executeScroll, 200);
    }
  };

  const navLinks = [
    { label: 'Overview', id: 'overview' },
    { label: 'Process', id: 'process' },
    { label: 'Specializations', id: 'services' },
    { label: 'Escrow Guarantee', id: 'escrow' },
    { label: 'COA Standards', id: 'verification' },
    { label: 'FAQs', id: 'faq' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-2xl border-b border-sky-100 shadow-[0_2px_20px_rgba(2,132,199,0.06)] transition-all">
      {/* Top Luminous Ambient Sky-to-Blue Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 via-blue-600 to-transparent pointer-events-none" />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
            <BrandLogo size="sm" />
          </Link>
        </div>

        {/* Center: Desktop Nav Links (Clean, Centered Floating Pill) */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-slate-50/90 border border-slate-200/80 shadow-2xs backdrop-blur-md">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className="py-1.5 px-3 rounded-full text-[13px] font-semibold text-slate-600 hover:text-sky-950 hover:bg-white transition-all cursor-pointer select-none"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: CTAs */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {proUser ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-3 pr-2 rounded-full border border-sky-300 hover:border-sky-400 bg-sky-50/90 hover:bg-sky-100 transition shadow-2xs cursor-pointer"
              >
                <div className="text-left font-display">
                  <div className="text-xs font-bold text-sky-950 leading-tight max-w-[130px] truncate">
                    {proUser.name || 'Architect Partner'}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-sky-600 text-white">
                      Partner
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-sky-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 overflow-hidden">
                  {proUser.avatar || proUser.profilePhoto ? (
                    <img src={proUser.avatar || proUser.profilePhoto} alt={proUser.name} className="w-full h-full object-cover" />
                  ) : (
                    proUser.name ? proUser.name.slice(0, 2).toUpperCase() : 'AR'
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-sky-200 py-2.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 font-display">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="font-bold text-sky-950">{proUser.name || 'Architect Partner'}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{proUser.phone || proUser.email || ''}</div>
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
                        <Compass className="w-3 h-3 text-sky-600" />
                        <span>COA Registered Architect</span>
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/professional"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-sky-50 hover:text-sky-900 font-semibold transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-sky-600" />
                      <span>Architect Workspace</span>
                    </Link>
                    <Link
                      to="/architect/application-status"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-sky-50 hover:text-sky-900 font-semibold transition"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Application & Verification Status</span>
                    </Link>
                    <Link
                      to="/architect/profile-wizard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-sky-50 hover:text-sky-900 font-semibold transition"
                    >
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>Edit Practice Dossier & KYC</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleArchitectLogout}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out (Architect)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/architect/login"
                className="px-4 py-2 rounded-full text-xs font-bold text-sky-900 hover:text-sky-950 bg-sky-50 hover:bg-sky-100/90 border border-sky-200 transition shadow-2xs flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-600" />
                <span>Architect Login</span>
              </Link>
              <Link
                to="/architect/register"
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition shadow-sm hover:shadow-sky-500/20 flex items-center gap-1.5"
              >
                <span>Join as Partner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 focus:outline-none cursor-pointer"
            aria-label="Toggle Architect Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-sky-100 bg-white/98 backdrop-blur-2xl px-4 py-5 shadow-xl"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="text-xs font-bold text-sky-950">Architect & Civil Engineering</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    className="p-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:text-sky-900 hover:bg-sky-50/80 transition cursor-pointer select-none"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="pt-2 border-t border-sky-100 flex flex-col gap-2 font-display">
                {proUser ? (
                  <>
                    <Link
                      to="/professional"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-xs py-2.5 px-3 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Architect Workspace ({proUser.name || 'Partner'})</span>
                    </Link>
                    <Link
                      to="/architect/application-status"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Application Status</span>
                    </Link>
                    <button
                      onClick={handleArchitectLogout}
                      className="w-full text-xs py-2 px-3 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/architect/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-xs py-2.5 px-3 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 font-bold flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5 text-sky-600" />
                      <span>Architect Login</span>
                    </Link>
                    <Link
                      to="/architect/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-xs py-2.5 px-3 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Join as Partner</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
