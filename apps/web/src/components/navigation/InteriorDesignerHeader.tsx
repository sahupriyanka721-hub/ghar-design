import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo } from '../common/BrandLogo.js';
import {
  Palette,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Compass,
  Store,
} from 'lucide-react';

export const InteriorDesignerHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [partnerSwitcherOpen, setPartnerSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setPartnerSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setPartnerSwitcherOpen(false);
  }, [location.pathname, location.hash]);

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const isCurrentPage =
      location.pathname === '/interior-designer' ||
      location.pathname === '/interior-designers' ||
      location.pathname === '/interior-design';

    const executeScroll = () => {
      if (sectionId === 'overview') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
          window.history.pushState(null, '', '/interior-designer');
        } catch (_) {}
        return;
      }

      const el = document.getElementById(sectionId);
      if (el) {
        if ('scrollIntoView' in el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          const headerOffset = 76;
          const targetPos = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: Math.max(0, targetPos), behavior: 'smooth' });
        }
        try {
          window.history.pushState(null, '', `/interior-designer#${sectionId}`);
        } catch (_) {}
      }
    };

    if (isCurrentPage) {
      executeScroll();
    } else {
      navigate(`/interior-designer#${sectionId}`);
      setTimeout(executeScroll, 200);
    }
  };

  const navLinks = [
    { label: 'Overview', id: 'overview' },
    { label: 'Process', id: 'process' },
    { label: 'Specializations', id: 'services' },
    { label: '3D Studio & BOQ', id: 'studio' },
    { label: 'Escrow Security', id: 'escrow' },
    { label: 'FAQs', id: 'faq' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-2xl border-b border-blue-100 shadow-[0_2px_20px_rgba(13,148,136,0.06)] transition-all">
      {/* Top Luminous Ambient Teal-to-Emerald Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 via-sky-500 to-transparent pointer-events-none" />

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
              className="py-1.5 px-3 rounded-full text-[13px] font-semibold text-slate-600 hover:text-navy-950 hover:bg-white transition-all cursor-pointer select-none"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: CTAs */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-blue-50 text-navy-950 border border-blue-200 focus:outline-none cursor-pointer"
            aria-label="Toggle Interior Designer Menu"
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
            className="lg:hidden border-t border-blue-100 bg-white/98 backdrop-blur-2xl px-4 py-5 shadow-xl"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-navy-950">Interior & Spatial Design</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    className="p-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:text-navy-950 hover:bg-blue-50/80 transition cursor-pointer select-none"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
