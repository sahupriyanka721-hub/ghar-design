import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { BrandLogo } from './BrandLogo.js';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <BrandLogo size="md" theme="dark" />
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              India's premier civil construction, complete house building, and luxury interior design ecosystem. Delivering vetted quotations, transparent milestone tracking, and certified professional execution.
            </p>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-400">Registered Corporate Office:</p>
              <p className="text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Cyber City, DLF Phase 2, Gurugram, Haryana - 122002
              </p>
              <p className="text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" /> support@buildghar.in
              </p>
            </div>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Core Services</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/services/new-house-construction" className="hover:text-amber-400 transition">
                  New House Construction
                </Link>
              </li>
              <li>
                <Link to="/services/home-renovation" className="hover:text-amber-400 transition">
                  Home Renovation
                </Link>
              </li>
              <li>
                <Link to="/services/house-map-planning" className="hover:text-amber-400 transition">
                  House Maps & Blueprints
                </Link>
              </li>
              <li>
                <Link to="/services/structural-engineering" className="hover:text-amber-400 transition">
                  Structural RCC Design
                </Link>
              </li>
              <li>
                <Link to="/services/interior-designing" className="hover:text-amber-400 transition">
                  Complete Interior Design
                </Link>
              </li>
              <li>
                <Link to="/services/complete-construction-package" className="hover:text-amber-400 transition">
                  Complete Construction Package
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/how-it-works" className="hover:text-amber-400 transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/professionals" className="hover:text-amber-400 transition">
                  Verified Professionals
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-400 transition">
                  About BuildGhar
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-amber-400 transition">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition">
                  Contact Support
                </Link>
              </li>

            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BuildGhar Technologies India Pvt. Ltd. All rights reserved.</p>
          <p className="text-[11px] text-slate-500 text-center md:text-right max-w-xl">
            Disclaimer: BuildGhar acts as a transparent marketplace platform connecting homeowners with independent licensed professionals.
            All construction and structural engineering plans are authored by accredited certified engineering associates.
          </p>
        </div>
      </div>
    </footer>
  );
};
