import React, { useState, useEffect, useRef } from 'react';

import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.js';

import { useToast } from '../../context/ToastContext.js';

import { BrandLogo } from '../common/BrandLogo.js';
import { SectionErrorBoundary } from '../common/SectionErrorBoundary.js';

import { getProfessionalByPhone } from '../../data/customerStore.js';

import { getArchitectByPhone, saveArchitectAccount, formatArchitectId } from '../../data/architectStore.js';
import { saveProfessionalAccount } from '../../data/professionalStore.js';
import { compressAvatarImage } from '../../lib/utils.js';

import { motion } from 'framer-motion';

import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FileCheck2,
  CalendarCheck,
  UserCheck,
  LogOut,
  Layers,
  Building2,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Briefcase,
  Sparkles,
  Phone,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Zap,
  HardHat,
  Users,
  CreditCard,
  BarChart3,
  LifeBuoy,
  Sliders,
  Compass,
  Star,
  Bell,
  MessageSquare,
  Calculator,
  MapPin,
} from 'lucide-react';



/**

 * ProfessionalAuthGate

 * Dedicated, isolated Professional & Contractor Login Screen.

 * Homeowners, Vendors, and Admins are separated from this workspace.

 */

const ProfessionalAuthGate: React.FC = () => {

  const { user, logout, loginProfessionalWithOtp, requestOtp, switchDemoRole } = useAuth();

  const { success, error } = useToast();

  const navigate = useNavigate();




  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const [phone, setPhone] = useState(user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '');

  const [name, setName] = useState(user?.name || '');

  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);

  const [detectedPro, setDetectedPro] = useState<any>(null);



  useEffect(() => {

    const clean = phone.replace(/\D/g, '');

    if (clean.length === 10) {

      const found = getProfessionalByPhone(clean);

      setDetectedPro(found || null);

      if (found) {

        setName(found.name);

      }

    } else {

      setDetectedPro(null);

    }

  }, [phone]);



  const handleRequestOtp = async (e: React.FormEvent) => {

    e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {

      error('Please enter a valid 10-digit Indian mobile number');

      return;

    }



    const foundPro = getProfessionalByPhone(cleanPhone);

    const proName = foundPro?.name || name.trim() || 'Ar. Certified Professional';



    setLoading(true);

    try {
      const res = await requestOtp(cleanPhone, proName);
      const generatedOtp = res?.otp || '123456';
      setOtp(generatedOtp);
      setStep('OTP');
      success(`Professional verification code sent to +91 ${cleanPhone}`);

    } catch (err: any) {

      error(err.message || 'Failed to dispatch verification code');

    } finally {

      setLoading(false);

    }

  };



  const handleVerifyOtp = async (e: React.FormEvent) => {

    e.preventDefault();

    if (otp.trim().length !== 6) {

      error('Please enter a valid 6-digit numeric OTP');

      return;

    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const foundPro = getProfessionalByPhone(cleanPhone);

    const proName = foundPro?.name || name.trim() || 'Ar. Certified Professional';



    setLoading(true);

    try {

      await loginProfessionalWithOtp(cleanPhone, otp.trim(), proName);

      success(`Welcome to Professional Workspace, ${proName}!`);

      navigate('/professional');

    } catch (err: any) {

      error(err.message || 'Invalid OTP code');

    } finally {

      setLoading(false);

    }

  };



  const handleQuickDemoLogin = async (cleanPhone: string, proName: string) => {

    setLoading(true);

    try {

      await loginProfessionalWithOtp(cleanPhone, '123456', proName);

      success(`Welcome to Professional Workspace, ${proName}!`);

      navigate('/professional');

    } catch (err: any) {

      error(err.message || 'Demo login failed');

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50/70 text-slate-800 flex flex-col font-sans relative overflow-hidden">

      {/* Atmospheric Light-Blue Ambient Glows */}

      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />



      {/* Top Header Bar */}

      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between relative z-10 border-b border-sky-100/80 bg-white/70 backdrop-blur-md">
        <BrandLogo variant="light" size="md" subtitle="Architecture & Engineering Network" />

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-bold text-slate-600 hover:text-navy-950 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white transition"
          >
            Homeowner Login
          </Link>
        </div>
      </header>



      {/* Main Partner Gateway Showcase & Auth Form */}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">

        {/* Left Side: Professional Workspace Showcase */}

        <motion.div

          initial={{ opacity: 0, x: -30 }}

          animate={{ opacity: 1, x: 0 }}

          transition={{ duration: 0.6, ease: 'easeOut' }}

          className="flex-1 max-w-xl space-y-6"

        >

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-900 text-xs font-black uppercase tracking-wider shadow-2xs font-mono">

            <HardHat className="w-3.5 h-3.5 text-sky-600" />

            <span>Authorized Professional Workspace</span>

          </div>



          <div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-navy-950 tracking-tight leading-tight">

              Contractor & Engineering <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Workspace</span>

            </h1>

            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed font-medium">

              Review verified homeowner construction RFQs, build itemized BOQ estimations, and submit drawings with automated escrow releases.

            </p>

          </div>



          {/* Interactive Feature Cards (Light-Blue Accented) */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">

            <div className="p-4 rounded-2xl bg-white/95 border-2 border-sky-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all group">

              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-2xs">

                <Layers className="w-5 h-5" />

          </div>

              <div className="text-sm font-black text-slate-900">Assigned Client RFQs</div>

              <p className="text-xs text-slate-500 mt-1 leading-snug">Direct project specifications with plot dimensions & client budgets</p>

          </div>



            <div className="p-4 rounded-2xl bg-white/95 border-2 border-sky-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all group">

              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-2xs">

                <FileCheck2 className="w-5 h-5" />

          </div>

              <div className="text-sm font-black text-slate-900">Dynamic BOQ Builder</div>

              <p className="text-xs text-slate-500 mt-1 leading-snug">Itemized construction material quantities & civil labor slabs</p>

          </div>



            <div className="p-4 rounded-2xl bg-white/95 border-2 border-sky-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all group">

              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-2xs">

                <CalendarCheck className="w-5 h-5" />

          </div>

              <div className="text-sm font-black text-slate-900">Site Visits & Approvals</div>

              <p className="text-xs text-slate-500 mt-1 leading-snug">Schedule consultations and sign off foundation & structural milestones</p>

          </div>



            <div className="p-4 rounded-2xl bg-white/95 border-2 border-sky-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all group">

              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-2xs">

                <ShieldCheck className="w-5 h-5" />

          </div>

              <div className="text-sm font-black text-slate-900">Guaranteed Escrow</div>

              <p className="text-xs text-slate-500 mt-1 leading-snug">100% verified service fees disbursed on milestone completion</p>

          </div>

          </div>



          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-2 font-mono">

            <span className="flex items-center gap-1.5 text-sky-800">

              <CheckCircle2 className="w-4 h-4 text-sky-600" />

              COA Certified

            </span>

            <span>•</span>

            <span className="flex items-center gap-1.5 text-blue-800">

              <Building2 className="w-4 h-4 text-blue-600" />

              IBC Standard BOQ

            </span>

          </div>

        </motion.div>



        {/* Right Side: Compact, Light-Blue Interactive Gateway Card */}

        <motion.div

          initial={{ opacity: 0, y: 30 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}

          className="w-full max-w-md"

        >

          {/* Existing Session Alert */}

          {user && user.role !== 'PROFESSIONAL' && (

            <div className="p-3.5 mb-3 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 shadow-xs">

              <div>

                <div className="font-bold flex items-center gap-1.5">

                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />

                  <span>Logged in as {user.role}: {user.name}</span>

                </div>

                <p className="text-[11px] text-amber-700 mt-0.5">

                  Switch session or sign out to enter the professional partner desk.

                </p>

              </div>

              <div className="flex items-center gap-2 shrink-0">

                <button

                  type="button"

                  onClick={async () => {

                    setLoading(true);

                    try {

                      await switchDemoRole('PROFESSIONAL');

                      navigate('/professional');

                    } catch (e) {

                      console.error(e);

                    } finally {

                      setLoading(false);

                    }

                  }}

                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-[11px] shadow-xs cursor-pointer transition"

                >

                  Enter Architect Workspace

                </button>

                <button

                  type="button"

                  onClick={() => {

                    logout();

                    success('Logged out. Please enter your Professional mobile number.');

                  }}

                  className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl font-bold text-[11px] cursor-pointer transition"

                >

                  Sign Out

                </button>

              </div>

            </div>

          )}



          {/* Clean, Non-intimidating, Highly Polished Light-Blue Card */}

          <div className="bg-white/95 backdrop-blur-xl border-2 border-sky-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(14,165,233,0.12)] space-y-4">

            <div className="flex items-center justify-between border-b border-sky-100 pb-3">

              <div className="flex items-center gap-2.5">

                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25">

                  <Briefcase className="w-5 h-5 text-white" />

          </div>

                <div>

                  <h2 className="text-base font-black font-display text-navy-950">

                    Partner Gateway

                  </h2>

                  <p className="text-xs text-slate-500 font-semibold">

                    Professional Verification & Sign-In

                  </p>

          </div>

          </div>

              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-300">

                Account Safe

              </span>

          </div>







            {step === 'PHONE' ? (

              <form onSubmit={handleRequestOtp} className="space-y-3.5">

                <div>

                  <label className="text-xs font-black text-slate-800 block mb-1 flex items-center gap-1.5">

                    <Phone className="w-3.5 h-3.5 text-sky-600" />

                    <span>Registered Professional Mobile</span>

                  </label>

                  <div className="relative">

                    <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-600 font-mono">+91</span>

                    <input

                      type="tel"

                      required

                      maxLength={10}

                      placeholder="Enter 10-digit mobile number"

                      className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"

                      value={phone}

                      onChange={(e) => setPhone(e.target.value)}

                    />

          </div>



                  {detectedPro ? (

                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mt-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-300">

                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />

                      <span>Verified: {detectedPro.name} ({detectedPro.firmName})</span>

          </div>

                  ) : phone.replace(/\D/g, '').length === 10 ? (

                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-200">

                      <label className="text-xs font-black text-slate-800 block">

                        Contractor / Firm Name

                      </label>

                      <input

                        type="text"

                        placeholder=""

                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"

                        value={name}

                        onChange={(e) => setName(e.target.value)}

                      />

                      <p className="text-[11px] text-sky-800 font-semibold">

                        ✨ First-time login: This mobile number will be registered as your authorized Partner Workspace.

                      </p>

          </div>

                  ) : (

                    <p className="text-[11px] text-slate-500 mt-1 font-medium">

                      Enter your 10-digit mobile number. Instant OTP will be sent.

                    </p>

                  )}

          </div>



                <button

                  type="submit"

                  disabled={loading || phone.replace(/\D/g, '').length !== 10}

                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95"

                >

                  <span>{loading ? 'Sending OTP Code...' : 'Send Verification OTP'}</span>

                  <ArrowRight className="w-4 h-4" />

                </button>

              </form>

            ) : (

              <form onSubmit={handleVerifyOtp} className="space-y-3.5">

                <div>

                  <div className="flex items-center justify-between mb-1.5">

                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">

                      <KeyRound className="w-3.5 h-3.5 text-sky-600" />

                      <span>Enter 6-Digit OTP</span>

                    </label>

                    <button

                      type="button"

                      onClick={() => setStep('PHONE')}

                      className="text-[11px] font-bold text-sky-700 hover:underline"

                    >

                      Change Number

                    </button>

          </div>

                  <input

                    type="text"

                    required

                    autoFocus

                    maxLength={6}

                    placeholder="Enter 6-digit OTP"

                    className="w-full py-2.5 text-center tracking-[0.3em] text-lg font-bold font-mono bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"

                    value={otp}

                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}

                  />

          </div>



                <button

                  type="submit"

                  disabled={loading || otp.length !== 6}

                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95"

                >

                  <span>{loading ? 'Verifying OTP...' : 'Verify OTP & Enter Workspace'}</span>

                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />

                </button>

              </form>

            )}

          </div>

        </motion.div>

      </main>

    </div>

  );

};



export const ProfessionalLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileRefreshTick, setProfileRefreshTick] = useState(0);
  const navPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleSync = () => setProfileRefreshTick((t) => t + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('architect_store_updated', handleSync);
    window.addEventListener('user_profile_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('architect_store_updated', handleSync);
      window.removeEventListener('user_profile_updated', handleSync);
    };
  }, []);

  const archRecord = user?.phone ? getArchitectByPhone(user.phone) : null;
  const isArchitect = Boolean(archRecord);
  const proRecord = user?.phone ? getProfessionalByPhone(user.phone) : null;

  const cleanPhone = (user?.phone || archRecord?.phone || '').replace(/\D/g, '').slice(-10);
  const storedPhoto = cleanPhone ? (() => {
    try {
      return (
        localStorage.getItem(`arch_photo_${cleanPhone}`) ||
        localStorage.getItem(`arch_photo_+91${cleanPhone}`) ||
        localStorage.getItem(`profile_photo_${cleanPhone}`) ||
        localStorage.getItem(`user_photo_${cleanPhone}`) ||
        null
      );
    } catch {
      return null;
    }
  })() : null;

  const getCleanAvatarUrl = (raw?: string | null): string | null => {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '#' || trimmed === 'null' || trimmed === 'undefined') return null;
    return trimmed;
  };

  const rawAvatar =
    archRecord?.profilePhoto ||
    storedPhoto ||
    (user as any)?.avatar ||
    (user as any)?.profilePhoto ||
    proRecord?.profilePhoto ||
    (proRecord as any)?.avatar ||
    (proRecord as any)?.personal?.profilePhoto ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u.avatar || u.profilePhoto || null;
      } catch {
        return null;
      }
    })() ||
    null;

  const avatarUrl = getCleanAvatarUrl(rawAvatar);
  const displayName = user?.name || archRecord?.name || proRecord?.name || 'Architect Workspace';

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl, profileRefreshTick]);

  // Strict RBAC gate: Only authenticated users with role === 'PROFESSIONAL' can access
  if (!user || user.role !== 'PROFESSIONAL') {
    return <ProfessionalAuthGate />;
  }

  // Collapsible Accordion Sub-Menu States (17 Sections Spec)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    dashboard: false,
    profile: false,
    quotations: false,
    projects: false,
    designs: false,
    boq: false,
    'site-visits': false,
    customers: false,
    messages: false,
    deliverables: false,
    billing: false,
    reports: false,
    support: false,
    settings: false,
  });

  const toggleMenu = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const navItems = [
    {
      id: 'dashboard',
      label: '1. Dashboard',
      path: '/professional',
      icon: LayoutDashboard,
      exact: true,
      sublinks: [
        { label: 'Overview', path: '/professional' },
        { label: 'Profile Completion', path: '/professional/profile?tab=personal' },
        { label: 'Verification Status', path: '/professional/profile?tab=documents' },
        { label: 'New Quotation Requests', path: '/professional/assigned' },
        { label: 'Pending Quotations', path: '/professional/quotations?status=submitted' },
        { label: 'Accepted Quotations', path: '/professional/quotations/approved' },
        { label: 'Active Projects', path: '/professional/projects?status=active' },
        { label: 'Pending Design Approvals', path: '/professional/designs?tab=approvals' },
        { label: 'Upcoming Deadlines', path: '/professional/deliverables?tab=upcoming' },
        { label: 'Payment Summary', path: '/professional/billing' },
        { label: 'Notifications', path: '/professional/notifications' },
      ],
    },
    {
      id: 'profile',
      label: '2. Profile Management',
      path: '/professional/profile',
      icon: UserCheck,
      sublinks: [
        { label: '2.1 My Profile', path: '/professional/profile?tab=personal' },
        { label: '2.2 Business Management', path: '/professional/profile?tab=business' },
        { label: '2.3 KYC & Verification', path: '/professional/profile?tab=documents' },
        { label: '2.4 Portfolio Management', path: '/professional/profile?tab=portfolio' },
        { label: '2.5 Bank Details', path: '/professional/profile?tab=bank' },
      ],
    },
    {
      id: 'quotations',
      label: '3. Quotation Management',
      path: '/professional/quotations',
      icon: FileCheck2,
      sublinks: [
        { label: '3.1 New Requests', path: '/professional/assigned' },
        { label: '3.2 Generate Quotation', path: '/professional/quotation-builder' },
        { label: '3.3 Quotation List', path: '/professional/quotations' },
        { label: '3.4 Approved Quotations', path: '/professional/quotations/approved' },
        { label: '3.5 Quotation History', path: '/professional/quotations?tab=history' },
      ],
    },
    {
      id: 'projects',
      label: '4. Project Management',
      path: '/professional/projects',
      icon: HardHat,
      sublinks: [
        { label: '4.1 My Assigned Projects', path: '/professional/projects?tab=overview' },
        { label: '4.2 Project Overview', path: '/professional/projects?tab=overview' },
        { label: '4.3 Project Kickoff', path: '/professional/projects?tab=kickoff' },
        { label: '4.4 Project Planning', path: '/professional/projects?tab=planning' },
        { label: '4.5 Project Tasks', path: '/professional/projects?tab=tasks' },
        { label: '4.6 Project Coordination', path: '/professional/projects?tab=coordination' },
        { label: '4.7 Project Progress', path: '/professional/projects?tab=progress' },
      ],
    },
    {
      id: 'designs',
      label: '5. Architecture Design',
      path: '/professional/designs',
      icon: Compass,
      sublinks: [
        { label: '5.1 House Map / Floor Plan', path: '/professional/designs?tab=floor-plan' },
        { label: '5.2 Architectural Drawings', path: '/professional/designs?tab=drawings' },
        { label: '5.3 Design Files', path: '/professional/designs?tab=files' },
        { label: '5.4 Version Management', path: '/professional/designs?tab=versions' },
        { label: '5.5 Design Approval', path: '/professional/designs?tab=approvals' },
      ],
    },
    {
      id: 'boq',
      label: '6. BOQ & Cost Estimation',
      path: '/professional/boq',
      icon: Calculator,
      sublinks: [
        { label: 'Create New BOQ', path: '/professional/boq?action=create' },
        { label: 'BOQ Registry', path: '/professional/boq?action=list' },
        { label: 'Quantity & Cost Estimation', path: '/professional/boq?action=estimator' },
      ],
    },
    {
      id: 'site-visits',
      label: '7. Site Visit Management',
      path: '/professional/site-visits',
      icon: MapPin,
      sublinks: [
        { label: 'Upcoming Visits & Calendar', path: '/professional/site-visits?tab=calendar' },
        { label: 'Schedule Site Visit', path: '/professional/site-visits?tab=schedule' },
        { label: 'Site Visit Reports & Photos', path: '/professional/site-visits?tab=reports' },
      ],
    },
    {
      id: 'customers',
      label: '8. Customer Management',
      path: '/professional/customers',
      icon: Users,
      sublinks: [
        { label: 'My Customers', path: '/professional/customers?tab=list' },
        { label: 'Customer Requirements', path: '/professional/customers?tab=requirements' },
        { label: 'Customer Approval History', path: '/professional/customers?tab=history' },
      ],
    },
    {
      id: 'messages',
      label: '9. Communication & Collab',
      path: '/professional/messages',
      icon: MessageSquare,
      sublinks: [
        { label: 'Customer Messages', path: '/professional/messages?tab=customers' },
        { label: 'Admin Messages', path: '/professional/messages?tab=admin' },
        { label: 'Contractor & Consultant Desk', path: '/professional/messages?tab=consultants' },
      ],
    },
    {
      id: 'deliverables',
      label: '10. Milestone & Deliverables',
      path: '/professional/deliverables',
      icon: Layers,
      sublinks: [
        { label: 'Project Milestones', path: '/professional/deliverables?tab=milestones' },
        { label: 'Architecture Deliverables', path: '/professional/deliverables?tab=deliverables' },
        { label: 'Pending Approvals', path: '/professional/deliverables?tab=pending' },
      ],
    },
    {
      id: 'billing',
      label: '11. Billing & Payments',
      path: '/professional/billing',
      icon: CreditCard,
      sublinks: [
        { label: '11.1 My Earnings', path: '/professional/billing?tab=earnings' },
        { label: '11.2 Payment Schedule', path: '/professional/billing?tab=schedule' },
        { label: '11.3 Payment History', path: '/professional/billing?tab=history' },
        { label: '11.4 Payout Management', path: '/professional/billing?tab=payouts' },
        { label: '11.5 Invoices & Receipts', path: '/professional/billing?tab=invoices' },
      ],
    },
    {
      id: 'reports',
      label: '12. Reports & Analytics',
      path: '/professional/reports',
      icon: BarChart3,
      sublinks: [
        { label: 'Quotation Reports', path: '/professional/reports?type=quotations' },
        { label: 'Project Progress Reports', path: '/professional/reports?type=projects' },
        { label: 'Design Deliverable Reports', path: '/professional/reports?type=designs' },
        { label: 'Financial & Payout Reports', path: '/professional/reports?type=financial' },
      ],
    },
    {
      id: 'reviews',
      label: '13. Reviews & Ratings',
      path: '/professional/reviews',
      icon: Star,
    },
    {
      id: 'notifications',
      label: '14. Notifications',
      path: '/professional/notifications',
      icon: Bell,
    },
    {
      id: 'support',
      label: '15. Support & Help Center',
      path: '/professional/support',
      icon: LifeBuoy,
      sublinks: [
        { label: 'Raise Support Ticket', path: '/professional/support?tab=create' },
        { label: 'My Support Tickets', path: '/professional/support?tab=tickets' },
        { label: 'FAQs & Articles', path: '/professional/support?tab=faqs' },
      ],
    },
    {
      id: 'settings',
      label: '16. Settings',
      path: '/professional/settings',
      icon: Sliders,
      sublinks: [
        { label: '16.1 Account Settings', path: '/professional/settings?tab=account' },
        { label: '16.2 Security & Sessions', path: '/professional/settings?tab=security' },
        { label: '16.3 Notification Preferences', path: '/professional/settings?tab=notifications' },
        { label: '16.4 Availability & Working Hours', path: '/professional/settings?tab=availability' },
        { label: '16.5 Account Management', path: '/professional/settings?tab=management' },
      ],
    },
    {
      id: 'logout',
      label: '17. Logout',
      path: '#logout',
      icon: LogOut,
      isAction: true,
    },
  ];

  // Auto-expand menu containing active path
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.sublinks && item.sublinks.some((sub) => location.pathname === sub.path.split('?')[0])) {
        setOpenMenus((prev) => ({ ...prev, [item.id]: true }));
      }
    });
  }, [location.pathname]);

  if (archRecord) {
    if (archRecord.accountStatus === 'PROFILE_INCOMPLETE') {
      return <Navigate to="/architect/profile-wizard" replace />;
    }
    if (
      archRecord.accountStatus === 'REJECTED' ||
      archRecord.accountStatus === 'SUSPENDED'
    ) {
      return <Navigate to="/architect/application-status" replace />;
    }
  }

  const handleNavbarPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error('Profile photo must be less than 10MB');
      return;
    }

    try {
      const dataUrl = await compressAvatarImage(file);
      const phoneClean = (user?.phone || archRecord?.phone || '').replace(/\D/g, '').slice(-10);

      if (phoneClean) {
        try {
          localStorage.setItem(`arch_photo_${phoneClean}`, dataUrl);
        } catch {}
      }

      if (archRecord) {
        saveArchitectAccount({
          ...archRecord,
          profilePhoto: dataUrl,
        });
      }

      if (proRecord) {
        saveProfessionalAccount({
          ...proRecord,
          personal: {
            ...proRecord.personal,
            profilePhoto: dataUrl,
          },
        });
      }

      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          parsed.avatar = dataUrl;
          parsed.profilePhoto = dataUrl;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch {}

      setImgError(false);
      setProfileRefreshTick((t) => t + 1);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: { profilePhoto: dataUrl } }));
        window.dispatchEvent(new CustomEvent('user_profile_updated', { detail: { avatar: dataUrl } }));
      }

      success('Profile photo updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to upload photo');
    }
  };



  return (

    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* ---------------- PROFESSIONAL TOP NAVBAR ---------------- */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 border-b border-sky-200 shadow-xs h-16 flex items-center justify-between px-4 sm:px-6">

        <div className="flex items-center gap-3">

          <button

            onClick={() => setSidebarOpen(!sidebarOpen)}

            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-navy-950 hover:bg-sky-50 transition"

            aria-label="Toggle Menu"

          >

            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}

          </button>



          <Link

            to="/professional"

            className="flex items-center gap-2.5 py-1 px-3 rounded-2xl bg-gradient-to-r from-[#f6f9fe] via-[#edf4fc] to-[#f6f9fe] border border-[#d3e3f7]/70 shadow-[0_1px_3px_rgba(20,50,110,0.03)] hover:border-[#b8cde4] hover:bg-[#ebf3fc] transition-all"

          >

            <BrandLogo size="sm" subtitle={isArchitect ? "Architecture" : "Partner Workspace"} />

            <span className="px-2.5 py-0.5 bg-sky-100 border border-sky-300 text-sky-900 font-mono text-[10px] font-black rounded-full uppercase tracking-wider hidden sm:inline-block shadow-2xs">

              {isArchitect ? "Architecture & Engineering Panel" : "Engineering & Contractor Workspace"}

            </span>

          </Link>

        </div>



        {/* Right Workspace Utilities */}

        <div className="flex items-center gap-3">

          {/* Quick link to public marketplace */}

          



          {/* Verification Badge */}

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-900 border border-blue-200">

            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />

            <span>{isArchitect ? "COA Verified Architect" : "Verified Professional"}</span>

          </div>



          {/* Profile Dropdown */}

          {/* Hidden Input for Instant 1-Click Navbar Photo Upload */}
          <input
            ref={navPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleNavbarPhotoUpload}
          />

          <div className="relative">

            <button

              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}

              className="flex items-center gap-2.5 p-1 pl-2.5 pr-2 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 transition shadow-2xs cursor-pointer"

            >

              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  onError={() => setImgError(true)}
                  className="w-7 h-7 rounded-lg object-cover border border-sky-300 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 font-display">
                  {displayName ? displayName.slice(0, 2).toUpperCase() : <Briefcase className="w-3.5 h-3.5" />}
                </div>
              )}

              <div className="text-left hidden sm:block">

                <div className="text-xs font-black text-slate-900 leading-tight max-w-[140px] truncate">

                  {user?.name || proRecord?.name || 'Professional Workspace'}

          </div>

                <div className="text-[10px] text-sky-700 font-mono font-bold">

                  {user?.phone || ''}

          </div>

          </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />

            </button>



            {profileDropdownOpen && (

              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs text-slate-800 animate-in fade-in duration-150">

                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-3">
                  <div className="relative group shrink-0">
                    {avatarUrl && !imgError ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        onError={() => setImgError(true)}
                        className="w-10 h-10 rounded-xl object-cover border border-sky-300 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 font-display">
                        {displayName ? displayName.slice(0, 2).toUpperCase() : <Briefcase className="w-5 h-5" />}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => navPhotoInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-150 cursor-pointer"
                      title="Upload/change photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 truncate">{displayName}</div>
                    <div className="text-slate-500 text-[11px] font-mono">{user?.phone || ''}</div>
                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 truncate">
                        {isArchitect ? (archRecord?.designation || 'COA Verified Architect') : 'Associate Professional / Engineer'}
                      </span>
                      {isArchitect && archRecord?.id && (archRecord.accountStatus === 'APPROVED' || archRecord.isVerified) && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {formatArchitectId(archRecord.id)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1-Click Upload / Change Photo inside dropdown */}
                <button
                  type="button"
                  onClick={() => navPhotoInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-sky-50 font-bold text-sky-800 border-b border-slate-100 transition cursor-pointer text-left"
                >
                  <Camera className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{avatarUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}</span>
                </button>



                <Link

                  to="/professional/profile"

                  onClick={() => setProfileDropdownOpen(false)}

                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 font-bold text-slate-700"

                >

                  <UserCheck className="w-4 h-4 text-blue-600" />

                  <span>Profile & Credentials</span>

                </Link>



                <Link

                  to="/professional/quotation-builder"

                  onClick={() => setProfileDropdownOpen(false)}

                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 font-bold text-slate-700"

                >

                  <PlusCircle className="w-4 h-4 text-sky-600" />

                  <span>New Quotation Builder</span>

                </Link>



                <button

                  onClick={() => {

                    setProfileDropdownOpen(false);

                    logout();

                    window.location.href = '/';

                  }}

                  className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold border-t border-slate-100"

                >

                  <LogOut className="w-4 h-4 text-rose-500" />

                  <span>Sign Out of Workspace</span>

                </button>

          </div>

            )}

          </div>

        </div>

      </header>



      {/* ---------------- MAIN BODY (SIDEBAR + CONTENT) ---------------- */}

      <div className="flex-1 flex overflow-hidden">

        {/* Mobile backdrop */}

        {sidebarOpen && (

          <div

            onClick={() => setSidebarOpen(false)}

            className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-2xs"

          />

        )}



        {/* Dedicated Professional Sidebar */}

        <aside

          className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-sky-200 text-slate-700 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${

            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'

          }`}

        >

          {/* Navigation Menu */}

          <div className="p-3.5 space-y-1.5 overflow-y-auto max-h-[calc(100vh-10rem)] text-xs scrollbar-thin scrollbar-thumb-sky-200">

            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-800 flex items-center justify-between">
              <span>{isArchitect ? "Architecture Panel (17 Modules)" : "Partner Navigation"}</span>
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const hasSublinks = Boolean(item.sublinks && item.sublinks.length > 0);
              const isSublinkActive = hasSublinks && item.sublinks!.some((sub) => location.pathname === sub.path.split('?')[0]);
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname === item.path || isSublinkActive;
              const isMenuOpen = Boolean(openMenus[item.id]);
              const isExpanded = isMenuOpen || isSublinkActive;

              if (item.isAction) {
                return (
                  <div key={item.id} className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSidebarOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-rose-600 hover:bg-rose-50 transition text-xs cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div key={item.id || item.path} className="space-y-1">
                  <div
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl font-bold transition text-xs cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/25'
                        : 'text-slate-700 hover:bg-sky-50 hover:text-navy-950'
                    }`}
                    onClick={(e) => {
                      if (hasSublinks) {
                        toggleMenu(item.id, e);
                      } else {
                        setSidebarOpen(false);
                        navigate(item.path);
                      }
                    }}
                  >
                    <Link
                      to={item.path}
                      onClick={(e) => {
                        if (hasSublinks) {
                          e.stopPropagation();
                          setSidebarOpen(false);
                        }
                      }}
                      className="flex items-center gap-2.5 min-w-0 flex-1"
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-sky-600'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>

                    {hasSublinks && (
                      <button
                        type="button"
                        onClick={(e) => toggleMenu(item.id, e)}
                        className="p-1 -mr-1 rounded-md hover:bg-black/10 transition cursor-pointer"
                      >
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-sky-100' : isActive ? 'text-sky-200' : 'text-slate-400'
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {hasSublinks && isExpanded && (
                    <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-sky-100 ml-3.5">
                      {item.sublinks!.map((sub) => {
                        const isSubActive =
                          (location.pathname + location.search === sub.path) ||
                          (location.pathname === sub.path.split('?')[0] && !location.search);

                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                              isSubActive
                                ? 'bg-sky-100 text-sky-950 font-bold'
                                : 'text-slate-600 hover:bg-sky-50 hover:text-slate-900'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          </div>



          {/* Bottom Profile Snapshot Card */}

          <div className="p-4 border-t border-sky-100 bg-sky-50/60 text-xs space-y-2">

            <div className="flex items-center gap-2">

              <Building2 className="w-4 h-4 text-sky-600" />

              <div className="font-black text-slate-900 truncate">

                {proRecord?.firmName || user?.name || 'Professional Workspace'}

          </div>

          </div>

            <div className="text-[11px] text-slate-600 font-medium">

              Category: <strong className="text-slate-900">{proRecord?.category || 'Contractor & Engineering'}</strong>

          </div>

            <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold">

              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />

              <span>GharDesign Verified Partner</span>

          </div>

          </div>

        </aside>



        {/* Main Content Area */}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">

          {/* Real Architect Governance Status Banner */}
          {archRecord && archRecord.accountStatus === 'PENDING_APPROVAL' && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-amber-950 text-sm">Application Under Governance Verification</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200/90 text-amber-900 font-sans font-bold">
                      ID Issued on Approval
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Your Council of Architecture (COA) credentials are being verified by Super Admin. You have full access to explore the 10 architecture workspace modules and review client RFQs.
                  </p>
                </div>
              </div>
              <Link
                to="/architect/application-status"
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shrink-0 shadow-xs"
              >
                View Status Tracker
              </Link>
            </div>
          )}

          {archRecord && (archRecord.accountStatus === 'APPROVED' || archRecord.isVerified) && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-950">COA Verified Architectural Partner</span>
                  <span className="ml-2 font-mono font-black text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                    Official ID: {formatArchitectId(archRecord.id)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Full Commercial & Contract Permissions Active</span>
            </div>
          )}

          <SectionErrorBoundary sectionName="Professional Desk" fallbackUrl="/professional">
            <Outlet />
          </SectionErrorBoundary>

        </main>

      </div>

    </div>

  );

};

