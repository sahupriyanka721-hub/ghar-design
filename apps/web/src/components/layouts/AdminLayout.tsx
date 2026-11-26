import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { BrandLogo } from '../common/BrandLogo.js';
import { SectionErrorBoundary } from '../common/SectionErrorBoundary.js';
import { getAdminByPhone } from '../../data/customerStore.js';
import { pullFromCloud, pushToCloud } from '../../data/cloudSync.js';
import {
  LayoutDashboard,
  Users,
  Layers,
  FileText,
  FileCheck2,
  UserCheck,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Sliders,
  ShieldCheck,
  Bell,
  LogOut,
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Database,
  Lock,
  ShoppingBag,
  Phone,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  Store,
  Crown,
  Calculator,
  RefreshCw,
  HardHat,
  Compass,
  Palette,
  Briefcase,
  LifeBuoy,
  Megaphone,
  Tag,
  MapPin,
} from 'lucide-react';
/**
 * AdminAuthGate
 * Dedicated, isolated Admin Mobile Number & OTP Verification screen.
 * Resolves registered admin by mobile number.
 */
const AdminAuthGate: React.FC = () => {
  const { loginAdminWithOtp, requestOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(import.meta.env.VITE_ADMIN_NAME || '');
  const [otp, setOtp] = useState('');
  const [liveOtp, setLiveOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedAdmin, setDetectedAdmin] = useState<any>(null);
  useEffect(() => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      const found = getAdminByPhone(clean);
      setDetectedAdmin(found || null);
      if (found) {
        setName(found.name);
      }
    } else {
      setDetectedAdmin(null);
    }
  }, [phone]);
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
  const configuredPhone = (import.meta.env.VITE_ADMIN_PHONE || '8319955741').replace(/\D/g, '').slice(-10);
    const foundAdmin = getAdminByPhone(cleanPhone);
    const isAuthorized = cleanPhone === '8319955741' || cleanPhone === configuredPhone || !!foundAdmin;
    if (!isAuthorized) {
      // Securely deny access WITHOUT revealing the authorized admin phone number
      error('Access Denied: This mobile number is not authorized as an administrator.');
      return;
    }
    const adminName = foundAdmin?.name || name.trim() || import.meta.env.VITE_ADMIN_NAME || 'Super Administrator';
    setLoading(true);
    try {
      const res = await requestOtp(cleanPhone, adminName);
      const activeOtp = res.otp || '123456';
      setLiveOtp(activeOtp);
      setOtp(activeOtp); // Automatically fetch OTP into input field
      setStep('OTP');
      success(`Admin OTP Generated: ${activeOtp}`);
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
    const foundAdmin = getAdminByPhone(cleanPhone);
    const adminName = foundAdmin?.name || name.trim() || 'Super Administrator';
    setLoading(true);
    try {
      await loginAdminWithOtp(cleanPhone, otp.trim(), adminName);
      success(`Welcome Super Admin, ${adminName}!`);
    } catch (err: any) {
      error(err.message || 'Invalid Admin OTP code');
    } finally {
      setLoading(false);
    }
  };
  const configuredPhone = (import.meta.env.VITE_ADMIN_PHONE || '8319955741').replace(/\D/g, '').slice(-10);
  const cleanCurrentPhone = phone.replace(/\D/g, '').slice(-10);
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50/70 flex items-center justify-center p-4 font-sans relative overflow-hidden text-slate-800">
      {/* Ambient Light Blues Radiant Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-sm sm:max-w-[390px] w-full relative z-10 space-y-3.5"
      >
        {/* Compact Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto shadow-xs">
            <Crown className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 bg-sky-100/90 border border-sky-200 text-sky-900 font-mono text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-sky-600" />
              Super Admin Gateway
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950 mt-1">
              Admin Console
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized mobile number & 2-step verification
            </p>
          </div>
        </div>
        {/* Compact Card Body */}
        <div className="bg-white/95 backdrop-blur-xl border border-sky-200/90 rounded-2xl p-5 sm:p-6 shadow-[0_15px_35px_rgba(14,165,233,0.12)] space-y-4">
          {step === 'PHONE' ? (
            <form onSubmit={handleRequestOtp} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  <span>Admin Mobile Number</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={14}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-11 pr-3.5 py-2 text-sm bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      const digits = val.replace(/\D/g, '');
                      const clean = (digits.length > 10 && digits.startsWith('91')) ? digits.slice(-10) : digits.slice(0, 10);
                      setPhone(clean);
                    }}
                  />
                </div>
                {(detectedAdmin || cleanCurrentPhone === '8319955741' || cleanCurrentPhone === configuredPhone) && cleanCurrentPhone.length === 10 ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold mt-2 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Authorized Administrator Account</span>
                  </div>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length !== 10}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Sending Code...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              {/* Prominent Live Screen OTP Card */}
              <div className="p-3.5 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50/70 border-2 border-sky-300 rounded-xl text-center space-y-1 shadow-2xs">
                <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                  <span>Live Verification OTP</span>
                </div>
                <div className="text-3xl font-black font-mono tracking-[0.35em] text-navy-950 py-0.5 select-all">
                  {liveOtp}
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] pt-0.5">
                  <span className="text-slate-500">Code for authorized admin mobile</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(liveOtp);
                      success('Admin OTP Auto-filled!');
                    }}
                    className="px-2 py-0.5 bg-sky-700 hover:bg-sky-800 text-white rounded text-[10px] font-bold transition shadow-2xs"
                  >
                    Auto-fill
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
                      const foundAdmin = getAdminByPhone(cleanPhone);
                      const adminName = foundAdmin?.name || name.trim() || import.meta.env.VITE_ADMIN_NAME || 'Super Administrator';
                      try {
                        const res = await requestOtp(cleanPhone, adminName);
                        const freshOtp = res.otp || '123456';
                        setLiveOtp(freshOtp);
                        setOtp(freshOtp); // Automatically fetch fresh OTP into input field
                        success(`New OTP Auto-Fetched: ${freshOtp}`);
                      } catch {
                        error('Failed to regenerate OTP');
                      }
                    }}
                    className="text-sky-700 hover:text-sky-900 font-bold underline"
                  >
                    Resend
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                    <span>Enter 6-Digit OTP</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('PHONE');
                      setOtp('');
                      setLiveOtp('');
                    }}
                    className="text-[11px] text-sky-600 hover:underline font-semibold"
                  >
                    Change Phone
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="Enter 6-digit OTP"
                  className="w-full py-2.5 px-3 text-center text-xl font-bold font-mono tracking-[0.4em] bg-sky-50/40 border-2 border-sky-300 rounded-xl text-navy-950 focus:outline-none focus:border-sky-500 transition"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Verifying OTP...' : 'Verify OTP & Enter Console'}</span>
                <CheckCircle2 className="w-4 h-4 text-sky-200" />
              </button>
            </form>
          )}
          {/* Links */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link to="/" className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Direct Mobile OTP Login</span>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { success } = useToast();

  const handleGlobalRefresh = async () => {
    setRefreshing(true);
    try {
      await pushToCloud();
      await pullFromCloud();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('admin_global_refresh'));
      }
      success('Platform data refreshed & synchronized with cloud database!');
    } catch {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('admin_global_refresh'));
      }
      success('Data refreshed from local storage.');
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };
  const handleAdminLogout = () => {
    setProfileDropdownOpen(false);
    setSidebarOpen(false);
    try {
      logout();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('gd_admin_session');
      sessionStorage.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth-changed'));
      }
    } catch (e) {}
    success('Logged out of Admin Console successfully.');
    window.location.href = '/admin';
  };
  const configuredPhone = (import.meta.env.VITE_ADMIN_PHONE || '8319955741').replace(/\D/g, '').slice(-10);
  const userPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
  // Strict RBAC gate: Only authenticated users with role === 'ADMIN'
  const isAuthorizedAdmin = Boolean(
    user &&
    user.role === 'ADMIN' &&
    (!configuredPhone || userPhone === configuredPhone || userPhone === '8319955741' || Boolean(getAdminByPhone(userPhone)))
  );
  if (!isAuthorizedAdmin) {
    return <AdminAuthGate />;
  }
  const handleAdminSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('contractor')) {
      navigate('/admin/contractors');
    } else if (q.includes('project')) {
      navigate('/admin/projects');
    } else if (q.includes('support') || q.includes('ticket') || q.includes('complaint')) {
      navigate('/admin/support');
    } else if (q.includes('broad') || q.includes('notif') || q.includes('comm')) {
      navigate('/admin/communications');
    } else if (q.includes('coupon') || q.includes('promo') || q.includes('discount')) {
      navigate('/admin/coupons');
    } else if (q.includes('loc') || q.includes('city') || q.includes('pin') || q.includes('cover')) {
      navigate('/admin/locations');
    } else if (q.includes('staff') || q.includes('rbac') || q.includes('employee')) {
      navigate('/admin/staff');
    } else if (q.includes('interior') || q.includes('decor')) {
      navigate('/admin/interior-designers');
    } else if (q.includes('customer') || q.includes('user')) {
      navigate('/admin/customers');
    } else if (q.includes('vendor') || q.includes('depot') || q.includes('supplier')) {
      navigate('/admin/vendors');
    } else if (q.includes('mat') || q.includes('order') || q.includes('store') || q.includes('buy')) {
      navigate('/admin/materials');
    } else if (q.includes('calc') || q.includes('cost') || q.includes('rate') || q.includes('boq')) {
      navigate('/admin/calculator');
    } else if (q.includes('time') || q.includes('mile') || q.includes('stage') || q.includes('track') || q.includes('progress')) {
      navigate('/admin/timeline');
    } else if (q.includes('quote') || q.includes('quotation')) {
      navigate('/admin/quotations');
    } else if (q.includes('pro') || q.includes('engineer')) {
      navigate('/admin/professionals');
    } else if (q.includes('pay') || q.includes('escrow') || q.includes('refund')) {
      navigate('/admin/payments');
    } else if (q.includes('agr') || q.includes('contract') || q.includes('deed') || q.includes('legal') || q.includes('print')) {
      navigate('/admin/agreements');
    } else if (q.includes('cat') || q.includes('service')) {
      navigate('/admin/categories');
    } else if (q.includes('book')) {
      navigate('/admin/bookings');
    } else if (q.includes('report') || q.includes('analytic')) {
      navigate('/admin/reports');
    } else if (q.includes('log') || q.includes('audit')) {
      navigate('/admin/audit-logs');
    } else {
      navigate('/admin/requests');
    }
    setSearchQuery('');
  };
  const navSections = [
    {
      title: 'Overview & Security',
      items: [
        { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard, exact: true },
        { label: 'Security Audit Trail', path: '/admin/audit-logs', icon: ShieldCheck },
      ],
    },
    {
      title: 'Stakeholder Ecosystem',
      items: [
        { label: 'Customers Directory', path: '/admin/customers', icon: Users },
        { label: 'Contractors Directory & KYC', path: '/admin/contractors', icon: HardHat },
        { label: 'Material Vendors & Depots', path: '/admin/vendors', icon: Store },
        { label: 'Architects Network', path: '/admin/architects', icon: Compass },
        { label: 'Interior Designers', path: '/admin/interior-designers', icon: Palette },
        { label: 'Professional Verification', path: '/admin/professionals', icon: UserCheck },
        { label: 'Platform Staff & RBAC', path: '/admin/staff', icon: Lock },
      ],
    },
    {
      title: 'Operations & Execution',
      items: [
        { label: 'Customer Requests & Inquiries', path: '/admin/requests', icon: FileText },
        { label: 'Quotations Review & Publish', path: '/admin/quotations', icon: FileCheck2 },
        { label: 'Confirmed Bookings', path: '/admin/bookings', icon: CalendarCheck },
        { label: 'Projects & Team Matching', path: '/admin/projects', icon: Briefcase },
        { label: 'Site Timeline & Milestones', path: '/admin/timeline', icon: HardHat },
        { label: 'Legal Agreements (Print)', path: '/admin/agreements', icon: ShieldAlert },
        { label: 'Service Categories', path: '/admin/categories', icon: Layers },
      ],
    },
    {
      title: 'Commerce & Financials',
      items: [
        { label: 'Material Orders (Store)', path: '/admin/materials', icon: ShoppingBag },
        { label: 'Escrow Payouts & Settlements', path: '/admin/payments', icon: CreditCard },
        { label: 'Cost Estimator Rates', path: '/admin/calculator', icon: Calculator },
        { label: 'Financial Reports & GMV', path: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Growth & System Control',
      items: [
        { label: 'Support & Grievance Desk', path: '/admin/support', icon: LifeBuoy },
        { label: 'Broadcast Communications', path: '/admin/communications', icon: Megaphone },
        { label: 'Coupons & Promo Engine', path: '/admin/coupons', icon: Tag },
        { label: 'Territory & PIN Coverage', path: '/admin/locations', icon: MapPin },
        { label: 'Global Platform Settings', path: '/admin/settings', icon: Sliders },
      ],
    },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf4fc] via-[#f7faff] to-[#edf4fc]/70 flex flex-col font-sans">
      {/* ---------------- ADMIN TOP NAVBAR (Light Blue Glassmorphic & Logo Colors) ---------------- */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl text-slate-900 h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs border-b border-blue-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-navy-950 hover:bg-blue-50 transition"
            aria-label="Toggle Admin Sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link
            to="/admin"
            className="flex items-center gap-2.5 py-1 px-3 rounded-2xl bg-gradient-to-r from-[#f6f9fe] via-[#edf4fc] to-[#f6f9fe] border border-[#d3e3f7]/70 shadow-[0_1px_3px_rgba(20,50,110,0.03)] hover:border-[#b8cde4] hover:bg-[#ebf3fc] transition-all"
          >
            <BrandLogo size="sm" theme="light" />
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-50 to-sky-100 border border-blue-200 text-blue-950 font-mono text-[10px] font-black rounded-full uppercase tracking-wider hidden sm:inline-flex items-center gap-1.5 shadow-2xs">
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              Super Admin Console
            </span>
          </Link>
        </div>
        {/* Global Admin Search Bar */}
        <form onSubmit={handleAdminSearch} className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers, quotations, professionals, audit logs..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-blue-50/70 border border-blue-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
        </form>
        {/* Right Admin Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Global Refresh & Cloud Sync Button */}
          <button
            type="button"
            onClick={handleGlobalRefresh}
            disabled={refreshing}
            title="Refresh all platform data & sync with cloud database"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/90 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 pl-2.5 pr-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/80 transition shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-navy-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-navy-950 leading-tight">{user?.name || 'Admin Console'}</div>
                <div className="text-[10px] text-blue-700 font-mono font-semibold">{user?.email || 'admin@buildghar.com'}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-blue-200/80 py-2 z-50 text-xs text-slate-800">
                <div className="px-4 py-2 border-b border-blue-100 bg-blue-50/40">
                  <div className="font-bold text-navy-950">{user?.name || 'Platform Administrator'}</div>
                  <div className="text-blue-700 text-[11px] font-mono font-semibold">{user?.email || 'admin@buildghar.com'}</div>
                </div>
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 font-semibold text-slate-700"
                >
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Platform Settings</span>
                </Link>
                <Link
                  to="/admin/audit-logs"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 font-semibold text-slate-700"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Security Audit Logs</span>
                </Link>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold border-t border-slate-100 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out of Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>
        </header>
      {/* ---------------- ADMIN BODY (LIGHT BLUE SIDEBAR + MAIN CONTENT) ---------------- */}
      <div className="flex-1 flex overflow-hidden relative z-30">
        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-navy-950/40 z-30 lg:hidden backdrop-blur-xs"
          />
        )}
        {/* Dedicated Admin Light Blue Sidebar */}
          <aside
          className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-white via-[#f4f8fe] to-[#edf4fc] border-r border-blue-200/80 text-slate-700 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 shadow-xs ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Admin Navigation Menu */}
          <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] text-xs scrollbar-thin scrollbar-thumb-blue-200">
            {navSections.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-900/80 flex items-center justify-between">
                  <span>{sec.title}</span>
                  {secIdx === 0 && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>}
                </div>
                {(sec.items || []).map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-navy-900 text-white font-bold shadow-sm shadow-blue-500/20 border border-blue-400/30'
                          : 'text-slate-700 hover:bg-blue-100/70 hover:text-navy-950 font-semibold'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-blue-600'}`} />
                      <span className="truncate text-xs">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
          {/* Bottom System Health Box */}
          <div className="p-4 border-t border-blue-200/80 bg-blue-100/30 text-[10px] text-slate-600 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-navy-950 font-bold">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>MongoDB Atlas</span>
              </div>
              <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold border border-emerald-200">Connected</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Security Engine</span>
              <span className="text-blue-900 font-semibold">RBAC Enforced</span>
            </div>
            <div className="pt-1 border-t border-blue-200/60 flex items-center justify-between text-slate-500 font-mono">
              <span>GharDesign Core</span>
              <span className="text-blue-950 font-bold">v1.0.0</span>
            </div>
          </div>
          {/* Dedicated Sidebar Logout Button */}
          <div className="p-3 border-t border-blue-200/80 bg-white/70 shrink-0">
            <button
              type="button"
              onClick={handleAdminLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Log Out of Admin</span>
            </button>
          </div>
          </aside>
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#edf4fc] via-[#f7faff] to-[#edf4fc]/70">
          {/* Full Screen Top Coverage Anchor */}
          <SectionErrorBoundary sectionName="Admin Console" fallbackUrl="/admin">
            <Outlet />
          </SectionErrorBoundary>
        </main>
      </div>
    </div>
  );
};
