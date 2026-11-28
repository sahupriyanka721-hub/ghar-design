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
  MasterAdminRole,
  ADMIN_ROLE_DEFINITIONS,
  INITIAL_ADMIN_STAFF_V2,
  getActiveAdminRole,
  setActiveAdminRole,
  hasAdminPermission,
} from '../../data/adminRbacStore.js';
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
  Sparkles,
  HelpCircle,
  FolderGit2,
  Globe,
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
          {/* Quick RBAC Test Persona Picker */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Quick Test Personas (8 Roles)</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
              {INITIAL_ADMIN_STAFF_V2.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPhone(p.phone);
                    setName(p.name);
                    setActiveAdminRole(p.role);
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 hover:border-sky-400 bg-slate-50/70 hover:bg-sky-50 text-left transition flex items-center gap-1.5 cursor-pointer text-[10px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-navy-950 truncate">{p.name.split(' ')[0]}</div>
                    <div className="text-[9px] text-slate-500 uppercase font-mono truncate">{p.role.replace('_ADMIN', '').replace('_MANAGER', '')}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

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
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [activeRole, setActiveRoleState] = useState<MasterAdminRole>(getActiveAdminRole());
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // All submenus closed by default; only open when explicitly clicked by user
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  // Quick Section Category Filter for 0-scroll navigation: 'ALL' | 0 | 1 | 2 | 3 | 4 | 5
  const [activeSectionFilter, setActiveSectionFilter] = useState<'ALL' | number>('ALL');
  // Accordion state for the 6 navSections (single open section by default for zero vertical scroll)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });
  const { success } = useToast();

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => {
      const isCurrentlyOpen = Boolean(prev[idx]);
      if (isCurrentlyOpen) {
        return { ...prev, [idx]: false };
      }
      return {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        [idx]: true,
      };
    });
  };

  const expandAllSections = () => {
    setOpenSections({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true });
  };

  const collapseAllSections = () => {
    setOpenSections({ 0: false, 1: false, 2: false, 3: false, 4: false, 5: false });
  };

  useEffect(() => {
    const onRoleSwitched = (e: any) => {
      setActiveRoleState(e.detail || getActiveAdminRole());
    };
    window.addEventListener('admin_role_switched', onRoleSwitched);
    return () => window.removeEventListener('admin_role_switched', onRoleSwitched);
  }, []);

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
    } else if (q.includes('calc') || q.includes('cost') || q.includes('rate')) {
      navigate('/admin/calculator');
    } else if (q.includes('doc') || q.includes('drawing') || q.includes('blueprint') || q.includes('elevation') || q.includes('cad') || q.includes('boq')) {
      navigate('/admin/documents');
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
      title: '1. Core Governance & RBAC',
      items: [
        { label: 'Dashboard / Overview', path: '/admin', icon: LayoutDashboard, exact: true },
        {
          label: 'Admin User & Role Management',
          path: '/admin/staff',
          icon: Lock,
          subItems: [
            { label: 'Admin Users', path: '/admin/staff?view=ADMIN_USERS', view: 'ADMIN_USERS' },
            { label: 'Create Admin', path: '/admin/staff?view=CREATE_ADMIN', view: 'CREATE_ADMIN' },
            { label: 'Roles & Permissions', path: '/admin/staff?view=ROLES_PERMISSIONS', view: 'ROLES_PERMISSIONS' },
            { label: 'Activity Logs', path: '/admin/staff?view=ACTIVITY_LOGS', view: 'ACTIVITY_LOGS' },
          ],
        },
        {
          label: 'Security Audit Trail',
          path: '/admin/audit-logs',
          icon: ShieldCheck,
          subItems: [
            { label: 'Admin Activity', path: '/admin/audit-logs?view=ADMIN_ACTIVITY', view: 'ADMIN_ACTIVITY' },
            { label: 'Customer Activity', path: '/admin/audit-logs?view=CUSTOMER_ACTIVITY', view: 'CUSTOMER_ACTIVITY' },
            { label: 'Architect Activity', path: '/admin/audit-logs?view=ARCHITECT_ACTIVITY', view: 'ARCHITECT_ACTIVITY' },
            { label: 'Payment Activity', path: '/admin/audit-logs?view=PAYMENT_ACTIVITY', view: 'PAYMENT_ACTIVITY' },
            { label: 'Project Activity', path: '/admin/audit-logs?view=PROJECT_ACTIVITY', view: 'PROJECT_ACTIVITY' },
            { label: 'Status Change History', path: '/admin/audit-logs?view=STATUS_HISTORY', view: 'STATUS_HISTORY' },
            { label: 'Login History', path: '/admin/audit-logs?view=LOGIN_HISTORY', view: 'LOGIN_HISTORY' },
          ],
        },
        {
          label: 'Platform Settings',
          path: '/admin/settings',
          icon: Sliders,
          subItems: [
            { label: 'General Settings', path: '/admin/settings?view=GENERAL_SETTINGS', view: 'GENERAL_SETTINGS' },
            { label: 'Payment Gateway Settings', path: '/admin/settings?view=PAYMENT_GATEWAY', view: 'PAYMENT_GATEWAY' },
            { label: 'Payout Settings', path: '/admin/settings?view=PAYOUT_SETTINGS', view: 'PAYOUT_SETTINGS' },
            { label: 'OTP Settings', path: '/admin/settings?view=OTP_SETTINGS', view: 'OTP_SETTINGS' },
            { label: 'Email/SMS Settings', path: '/admin/settings?view=EMAIL_SMS_SETTINGS', view: 'EMAIL_SMS_SETTINGS' },
            { label: 'Tax Settings', path: '/admin/settings?view=TAX_SETTINGS', view: 'TAX_SETTINGS' },
            { label: 'Document Settings', path: '/admin/settings?view=DOCUMENT_SETTINGS', view: 'DOCUMENT_SETTINGS' },
            { label: 'Security Settings', path: '/admin/settings?view=SECURITY_SETTINGS', view: 'SECURITY_SETTINGS' },
          ],
        },
      ],
    },
    {
      title: '2. Stakeholder Ecosystem & KYC',
      items: [
        { label: 'Customer Management', path: '/admin/customers', icon: Users },
        {
          label: 'Architect Management & COA',
          path: '/admin/architects',
          icon: Compass,
          subItems: [
            { label: 'All Architects', path: '/admin/architects?view=ALL', view: 'ALL' },
            { label: 'New Applications', path: '/admin/architects?view=NEW_APPLICATIONS', view: 'NEW_APPLICATIONS' },
            { label: 'Pending Verification', path: '/admin/architects?view=PENDING_VERIFICATION', view: 'PENDING_VERIFICATION' },
            { label: 'KYC Verification', path: '/admin/architects?view=KYC_VERIFICATION', view: 'KYC_VERIFICATION' },
            { label: 'Business Verification', path: '/admin/architects?view=BUSINESS_VERIFICATION', view: 'BUSINESS_VERIFICATION' },
            { label: 'Qualification Verification', path: '/admin/architects?view=QUALIFICATION_VERIFICATION', view: 'QUALIFICATION_VERIFICATION' },
            { label: 'Portfolio Review', path: '/admin/architects?view=PORTFOLIO_REVIEW', view: 'PORTFOLIO_REVIEW' },
            { label: 'Approved Architects', path: '/admin/architects?view=APPROVED', view: 'APPROVED' },
            { label: 'Rejected Applications', path: '/admin/architects?view=REJECTED', view: 'REJECTED' },
            { label: 'Suspended Architects', path: '/admin/architects?view=SUSPENDED', view: 'SUSPENDED' },
            { label: 'Architect Performance', path: '/admin/architects?view=PERFORMANCE', view: 'PERFORMANCE' },
            { label: 'Architect Payment Details', path: '/admin/architects?view=PAYMENT_DETAILS', view: 'PAYMENT_DETAILS' },
          ],
        },
        { label: 'Contractor Directory & KYC', path: '/admin/contractors', icon: HardHat },
        { label: 'Interior Designers Network', path: '/admin/interior-designers', icon: Palette },
        { label: 'Material Vendors & Depots', path: '/admin/vendors', icon: Store },
      ],
    },
    {
      title: '3. Quotation & Assignment Desk',
      items: [
        {
          label: 'Quotation Request Management',
          path: '/admin/requests',
          icon: FileText,
          subItems: [
            { label: 'New Quotation Requests', path: '/admin/requests?view=NEW_REQUESTS', view: 'NEW_REQUESTS' },
            { label: 'Pending Assignment', path: '/admin/requests?view=PENDING_ASSIGNMENT', view: 'PENDING_ASSIGNMENT' },
            { label: 'Assigned Requests', path: '/admin/requests?view=ASSIGNED', view: 'ASSIGNED' },
            { label: 'Request Clarification', path: '/admin/requests?view=CLARIFICATION', view: 'CLARIFICATION' },
            { label: 'Request History', path: '/admin/requests?view=HISTORY', view: 'HISTORY' },
            { label: 'Cancelled Requests', path: '/admin/requests?view=CANCELLED', view: 'CANCELLED' },
          ],
        },
        {
          label: 'Architect Assignment Management',
          path: '/admin/assignments',
          icon: Briefcase,
          subItems: [
            { label: 'Assign Architect', path: '/admin/assignments?view=ASSIGN_ARCHITECT', view: 'ASSIGN_ARCHITECT' },
            { label: 'Reassign Architect', path: '/admin/assignments?view=REASSIGN_ARCHITECT', view: 'REASSIGN_ARCHITECT' },
            { label: 'Multiple Architect Assignment', path: '/admin/assignments?view=MULTI_ASSIGNMENT', view: 'MULTI_ASSIGNMENT' },
            { label: 'Assignment History', path: '/admin/assignments?view=HISTORY', view: 'HISTORY' },
            { label: 'Architect Availability', path: '/admin/assignments?view=AVAILABILITY', view: 'AVAILABILITY' },
            { label: 'Assignment Performance', path: '/admin/assignments?view=PERFORMANCE', view: 'PERFORMANCE' },
          ],
        },
        {
          label: 'Quotation Management',
          path: '/admin/quotations',
          icon: FileCheck2,
          subItems: [
            { label: 'Pending Architect Quotations', path: '/admin/quotations?view=PENDING_ARCHITECT', view: 'PENDING_ARCHITECT' },
            { label: 'Quotation Under Review', path: '/admin/quotations?view=UNDER_REVIEW', view: 'UNDER_REVIEW' },
            { label: 'Approved Quotations', path: '/admin/quotations?view=APPROVED', view: 'APPROVED' },
            { label: 'Rejected Quotations', path: '/admin/quotations?view=REJECTED', view: 'REJECTED' },
            { label: 'Revision Required', path: '/admin/quotations?view=REVISION_REQUIRED', view: 'REVISION_REQUIRED' },
            { label: 'Sent to Customer', path: '/admin/quotations?view=SENT_TO_CUSTOMER', view: 'SENT_TO_CUSTOMER' },
            { label: 'Customer Accepted Quotations', path: '/admin/quotations?view=CUSTOMER_ACCEPTED', view: 'CUSTOMER_ACCEPTED' },
            { label: 'Customer Rejected Quotations', path: '/admin/quotations?view=CUSTOMER_REJECTED', view: 'CUSTOMER_REJECTED' },
            { label: 'Expired Quotations', path: '/admin/quotations?view=EXPIRED', view: 'EXPIRED' },
            { label: 'Quotation History', path: '/admin/quotations?view=HISTORY', view: 'HISTORY' },
          ],
        },
        { label: 'Cost Estimator Rates Matrix', path: '/admin/calculator', icon: Calculator },
        { label: 'Service & Category Pricing', path: '/admin/services-config?view=PRICING_CONFIGURATION', icon: Layers },
      ],
    },
    {
      title: '4. Project Management & Delivery',
      items: [
        {
          label: 'Project Management',
          path: '/admin/projects',
          icon: FolderGit2,
          subItems: [
            { label: 'All Projects', path: '/admin/projects?view=ALL', view: 'ALL' },
            { label: 'New Projects', path: '/admin/projects?view=NEW', view: 'NEW' },
            { label: 'Project Kickoff', path: '/admin/projects?view=KICKOFF', view: 'KICKOFF' },
            { label: 'Active Projects', path: '/admin/projects?view=ACTIVE', view: 'ACTIVE' },
            { label: 'On-Hold Projects', path: '/admin/projects?view=ON_HOLD', view: 'ON_HOLD' },
            { label: 'Delayed Projects', path: '/admin/projects?view=DELAYED', view: 'DELAYED' },
            { label: 'Completed Projects', path: '/admin/projects?view=COMPLETED', view: 'COMPLETED' },
            { label: 'Cancelled Projects', path: '/admin/projects?view=CANCELLED', view: 'CANCELLED' },
            { label: 'Project Documents', path: '/admin/projects?view=DOCUMENTS', view: 'DOCUMENTS' },
            { label: 'Project Activity Timeline', path: '/admin/projects?view=TIMELINE', view: 'TIMELINE' },
          ],
        },
        {
          label: 'Design & Document Management',
          path: '/admin/documents',
          icon: FileCheck2,
          subItems: [
            { label: 'Architect Design Submissions', path: '/admin/documents?view=SUBMISSIONS', view: 'SUBMISSIONS' },
            { label: 'Floor Plans', path: '/admin/documents?view=FLOOR_PLANS', view: 'FLOOR_PLANS' },
            { label: 'House Maps', path: '/admin/documents?view=HOUSE_MAPS', view: 'HOUSE_MAPS' },
            { label: '2D Drawings', path: '/admin/documents?view=2D_DRAWINGS', view: '2D_DRAWINGS' },
            { label: '3D Designs', path: '/admin/documents?view=3D_DESIGNS', view: '3D_DESIGNS' },
            { label: 'Elevation Designs', path: '/admin/documents?view=ELEVATIONS', view: 'ELEVATIONS' },
            { label: 'Working Drawings', path: '/admin/documents?view=WORKING_DRAWINGS', view: 'WORKING_DRAWINGS' },
            { label: 'BOQ Documents', path: '/admin/documents?view=BOQ', view: 'BOQ' },
            { label: 'Design Approval Requests', path: '/admin/documents?view=APPROVAL_REQUESTS', view: 'APPROVAL_REQUESTS' },
            { label: 'Revision Requests', path: '/admin/documents?view=REVISIONS', view: 'REVISIONS' },
            { label: 'Approved Documents', path: '/admin/documents?view=APPROVED', view: 'APPROVED' },
            { label: 'Rejected Documents', path: '/admin/documents?view=REJECTED', view: 'REJECTED' },
            { label: 'Document Version History', path: '/admin/documents?view=VERSION_HISTORY', view: 'VERSION_HISTORY' },
          ],
        },
        {
          label: 'Milestone & Work Progress Management',
          path: '/admin/timeline',
          icon: HardHat,
          subItems: [
            { label: 'Project Milestones', path: '/admin/timeline?view=PROJECT_MILESTONES', view: 'PROJECT_MILESTONES' },
            { label: 'Pending Milestone Submissions', path: '/admin/timeline?view=PENDING_SUBMISSIONS', view: 'PENDING_SUBMISSIONS' },
            { label: 'Work Progress Verification', path: '/admin/timeline?view=WORK_PROGRESS_VERIFICATION', view: 'WORK_PROGRESS_VERIFICATION' },
            { label: 'Customer Approval Pending', path: '/admin/timeline?view=CUSTOMER_APPROVAL_PENDING', view: 'CUSTOMER_APPROVAL_PENDING' },
            { label: 'Admin Inspection', path: '/admin/timeline?view=ADMIN_INSPECTION', view: 'ADMIN_INSPECTION' },
            { label: 'Approved Milestones', path: '/admin/timeline?view=APPROVED_MILESTONES', view: 'APPROVED_MILESTONES' },
            { label: 'Rejected Milestones', path: '/admin/timeline?view=REJECTED_MILESTONES', view: 'REJECTED_MILESTONES' },
            { label: 'Delayed Milestones', path: '/admin/timeline?view=DELAYED_MILESTONES', view: 'DELAYED_MILESTONES' },
            { label: 'Milestone Payment Eligibility', path: '/admin/timeline?view=PAYMENT_ELIGIBILITY', view: 'PAYMENT_ELIGIBILITY' },
          ],
        },
        { label: 'Confirmed Service Bookings', path: '/admin/bookings', icon: CalendarCheck },
        { label: 'Legal Agreements & Contracts', path: '/admin/agreements', icon: ShieldAlert },
      ],
    },
    {
      title: '5. Finance, Payouts & Billing',
      items: [
        {
          label: 'Payment Management',
          path: '/admin/payments',
          icon: CreditCard,
          subItems: [
            { label: 'All Customer Payments', path: '/admin/payments?view=ALL', view: 'ALL' },
            { label: 'Pending Payment Verification', path: '/admin/payments?view=PENDING_VERIFICATION', view: 'PENDING_VERIFICATION' },
            { label: 'Successful Payments', path: '/admin/payments?view=SUCCESSFUL', view: 'SUCCESSFUL' },
            { label: 'Failed Payments', path: '/admin/payments?view=FAILED', view: 'FAILED' },
            { label: 'Refund Requests', path: '/admin/payments?view=REFUNDS', view: 'REFUNDS' },
            { label: 'Customer Payment History', path: '/admin/payments?view=CUSTOMER_HISTORY', view: 'CUSTOMER_HISTORY' },
            { label: 'Payment Reconciliation', path: '/admin/payments?view=RECONCILIATION', view: 'RECONCILIATION' },
            { label: 'Payment Gateway Transactions', path: '/admin/payments?view=GATEWAY_TRANSACTIONS', view: 'GATEWAY_TRANSACTIONS' },
          ],
        },
        {
          label: 'Architect Payout Management',
          path: '/admin/payouts',
          icon: Briefcase,
          subItems: [
            { label: 'Pending Architect Payouts', path: '/admin/payouts?view=PENDING_PAYOUTS', view: 'PENDING_PAYOUTS' },
            { label: 'Eligible for Payout', path: '/admin/payouts?view=ELIGIBLE', view: 'ELIGIBLE' },
            { label: 'Payout Approval', path: '/admin/payouts?view=APPROVAL_QUEUE', view: 'APPROVAL_QUEUE' },
            { label: 'Process Architect Payment', path: '/admin/payouts?view=PROCESS_PAYMENT', view: 'PROCESS_PAYMENT' },
            { label: 'Successful Payouts', path: '/admin/payouts?view=SUCCESSFUL_PAYOUTS', view: 'SUCCESSFUL_PAYOUTS' },
            { label: 'Failed Payouts', path: '/admin/payouts?view=FAILED_PAYOUTS', view: 'FAILED_PAYOUTS' },
            { label: 'Payout History', path: '/admin/payouts?view=PAYOUT_HISTORY', view: 'PAYOUT_HISTORY' },
            { label: 'Architect Earnings', path: '/admin/payouts?view=ARCHITECT_EARNINGS', view: 'ARCHITECT_EARNINGS' },
            { label: 'Commission & Platform Fees', path: '/admin/payouts?view=COMMISSION_FEES', view: 'COMMISSION_FEES' },
            { label: 'Payout Reconciliation', path: '/admin/payouts?view=PAYOUT_RECONCILIATION', view: 'PAYOUT_RECONCILIATION' },
          ],
        },
        {
          label: 'Invoice & Billing Management',
          path: '/admin/invoices',
          icon: FileText,
          subItems: [
            { label: 'Customer Invoices', path: '/admin/invoices?view=CUSTOMER_INVOICES', view: 'CUSTOMER_INVOICES' },
            { label: 'Architect Invoices', path: '/admin/invoices?view=ARCHITECT_INVOICES', view: 'ARCHITECT_INVOICES' },
            { label: 'Payment Receipts', path: '/admin/invoices?view=PAYMENT_RECEIPTS', view: 'PAYMENT_RECEIPTS' },
            { label: 'Credit Notes', path: '/admin/invoices?view=CREDIT_NOTES', view: 'CREDIT_NOTES' },
            { label: 'Refund Records', path: '/admin/invoices?view=REFUND_RECORDS', view: 'REFUND_RECORDS' },
            { label: 'Tax Reports', path: '/admin/invoices?view=TAX_REPORTS', view: 'TAX_REPORTS' },
            { label: 'Final Settlement', path: '/admin/invoices?view=FINAL_SETTLEMENT', view: 'FINAL_SETTLEMENT' },
          ],
        },
        { label: 'Civil Material Store Orders', path: '/admin/materials', icon: ShoppingBag },
      ],
    },
    {
      title: '6. Operations, Support & Content',
      items: [
        {
          label: 'Communication Management',
          path: '/admin/communications',
          icon: Megaphone,
          subItems: [
            { label: 'Customer Messages', path: '/admin/communications?view=CUSTOMER_MESSAGES', view: 'CUSTOMER_MESSAGES' },
            { label: 'Architect Messages', path: '/admin/communications?view=ARCHITECT_MESSAGES', view: 'ARCHITECT_MESSAGES' },
            { label: 'Admin Review Inbox', path: '/admin/communications?view=ADMIN_INBOX', view: 'ADMIN_INBOX' },
            { label: 'Customer-to-Architect Routed Messages', path: '/admin/communications?view=CUSTOMER_TO_ARCHITECT', view: 'CUSTOMER_TO_ARCHITECT' },
            { label: 'Architect-to-Customer Routed Messages', path: '/admin/communications?view=ARCHITECT_TO_CUSTOMER', view: 'ARCHITECT_TO_CUSTOMER' },
            { label: 'Clarification Requests', path: '/admin/communications?view=CLARIFICATION_REQUESTS', view: 'CLARIFICATION_REQUESTS' },
            { label: 'Internal Admin Notes', path: '/admin/communications?view=INTERNAL_ADMIN_NOTES', view: 'INTERNAL_ADMIN_NOTES' },
            { label: 'Communication History', path: '/admin/communications?view=COMMUNICATION_HISTORY', view: 'COMMUNICATION_HISTORY' },
          ],
        },
        {
          label: 'Complaint & Dispute Management',
          path: '/admin/support',
          icon: LifeBuoy,
          subItems: [
            { label: 'Customer Complaints', path: '/admin/support?view=CUSTOMER_COMPLAINTS', view: 'CUSTOMER_COMPLAINTS' },
            { label: 'Architect Complaints', path: '/admin/support?view=ARCHITECT_COMPLAINTS', view: 'ARCHITECT_COMPLAINTS' },
            { label: 'Payment Disputes', path: '/admin/support?view=PAYMENT_DISPUTES', view: 'PAYMENT_DISPUTES' },
            { label: 'Project Disputes', path: '/admin/support?view=PROJECT_DISPUTES', view: 'PROJECT_DISPUTES' },
            { label: 'Milestone Disputes', path: '/admin/support?view=MILESTONE_DISPUTES', view: 'MILESTONE_DISPUTES' },
            { label: 'Resolution Management', path: '/admin/support?view=RESOLUTION_MANAGEMENT', view: 'RESOLUTION_MANAGEMENT' },
            { label: 'Escalation Management', path: '/admin/support?view=ESCALATION_MANAGEMENT', view: 'ESCALATION_MANAGEMENT' },
          ],
        },
        {
          label: 'Reports & Analytics',
          path: '/admin/reports',
          icon: BarChart3,
          subItems: [
            { label: 'Customer Reports', path: '/admin/reports?view=CUSTOMER_REPORTS', view: 'CUSTOMER_REPORTS' },
            { label: 'Architect Reports', path: '/admin/reports?view=ARCHITECT_REPORTS', view: 'ARCHITECT_REPORTS' },
            { label: 'Quotation Reports', path: '/admin/reports?view=QUOTATION_REPORTS', view: 'QUOTATION_REPORTS' },
            { label: 'Project Reports', path: '/admin/reports?view=PROJECT_REPORTS', view: 'PROJECT_REPORTS' },
            { label: 'Milestone Reports', path: '/admin/reports?view=MILESTONE_REPORTS', view: 'MILESTONE_REPORTS' },
            { label: 'Payment Reports', path: '/admin/reports?view=PAYMENT_REPORTS', view: 'PAYMENT_REPORTS' },
            { label: 'Payout Reports', path: '/admin/reports?view=PAYOUT_REPORTS', view: 'PAYOUT_REPORTS' },
            { label: 'Revenue Reports', path: '/admin/reports?view=REVENUE_REPORTS', view: 'REVENUE_REPORTS' },
            { label: 'Commission Reports', path: '/admin/reports?view=COMMISSION_REPORTS', view: 'COMMISSION_REPORTS' },
            { label: 'Performance Reports', path: '/admin/reports?view=PERFORMANCE_REPORTS', view: 'PERFORMANCE_REPORTS' },
          ],
        },
        {
          label: 'Notification Management',
          path: '/admin/notifications',
          icon: Bell,
          subItems: [
            { label: 'Customer Notifications', path: '/admin/notifications?view=CUSTOMER_NOTIFICATIONS', view: 'CUSTOMER_NOTIFICATIONS' },
            { label: 'Architect Notifications', path: '/admin/notifications?view=ARCHITECT_NOTIFICATIONS', view: 'ARCHITECT_NOTIFICATIONS' },
            { label: 'Admin Notifications', path: '/admin/notifications?view=ADMIN_NOTIFICATIONS', view: 'ADMIN_NOTIFICATIONS' },
            { label: 'Email Templates', path: '/admin/notifications?view=EMAIL_TEMPLATES', view: 'EMAIL_TEMPLATES' },
            { label: 'SMS Templates', path: '/admin/notifications?view=SMS_TEMPLATES', view: 'SMS_TEMPLATES' },
            { label: 'Notification History', path: '/admin/notifications?view=NOTIFICATION_HISTORY', view: 'NOTIFICATION_HISTORY' },
          ],
        },
        { label: 'Coupons & Promotional Engine', path: '/admin/coupons', icon: Tag },
        { label: 'Territory & Coverage Locations', path: '/admin/locations', icon: MapPin },
        {
          label: 'CMS & Platform Content Management',
          path: '/admin/cms',
          icon: Globe,
          subItems: [
            { label: 'Homepage Content', path: '/admin/cms?view=HOMEPAGE_CONTENT', view: 'HOMEPAGE_CONTENT' },
            { label: 'About Us', path: '/admin/cms?view=ABOUT_US', view: 'ABOUT_US' },
            { label: 'Contact Us', path: '/admin/cms?view=CONTACT_US', view: 'CONTACT_US' },
            { label: 'FAQ', path: '/admin/cms?view=FAQ', view: 'FAQ' },
            { label: 'Terms & Conditions', path: '/admin/cms?view=TERMS_CONDITIONS', view: 'TERMS_CONDITIONS' },
            { label: 'Privacy Policy', path: '/admin/cms?view=PRIVACY_POLICY', view: 'PRIVACY_POLICY' },
            { label: 'Cancellation Policy', path: '/admin/cms?view=CANCELLATION_POLICY', view: 'CANCELLATION_POLICY' },
            { label: 'Refund Policy', path: '/admin/cms?view=REFUND_POLICY', view: 'REFUND_POLICY' },
          ],
        },
        {
          label: 'Service & Configuration Management',
          path: '/admin/services-config',
          icon: Layers,
          subItems: [
            { label: 'Service Categories', path: '/admin/services-config?view=SERVICE_CATEGORIES', view: 'SERVICE_CATEGORIES' },
            { label: 'Subcategories', path: '/admin/services-config?view=SUBCATEGORIES', view: 'SUBCATEGORIES' },
            { label: 'Service Types', path: '/admin/services-config?view=SERVICE_TYPES', view: 'SERVICE_TYPES' },
            { label: 'Project Types', path: '/admin/services-config?view=PROJECT_TYPES', view: 'PROJECT_TYPES' },
            { label: 'Pricing Configuration', path: '/admin/services-config?view=PRICING_CONFIGURATION', view: 'PRICING_CONFIGURATION' },
            { label: 'Quotation Request Fee', path: '/admin/services-config?view=QUOTATION_FEE', view: 'QUOTATION_FEE' },
            { label: 'Platform Commission Settings', path: '/admin/services-config?view=COMMISSION_SETTINGS', view: 'COMMISSION_SETTINGS' },
            { label: 'Milestone Templates', path: '/admin/services-config?view=MILESTONE_TEMPLATES', view: 'MILESTONE_TEMPLATES' },
            { label: 'Project Status Settings', path: '/admin/services-config?view=PROJECT_STATUS_SETTINGS', view: 'PROJECT_STATUS_SETTINGS' },
          ],
        },
      ],
    },
  ];

  // Auto-expand the section containing the current active route and keep single-accordion for zero vertical scrolling
  useEffect(() => {
    const activeIdx = navSections.findIndex((sec) =>
      sec.items.some((item) =>
        item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path)
      )
    );
    if (activeIdx !== -1) {
      setOpenSections({
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        [activeIdx]: true,
      });
    }
    setExpandedMenus({});
  }, [location.pathname]);

  // Close floating popovers when clicking outside the sidebar
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.admin-sidebar-container')) {
        setExpandedMenus({});
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const renderMenuItem = (item: any, isBottomHalf = false) => {
    const isActive = item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = Boolean(expandedMenus[item.path]);

    return (
      <div key={item.path} className="relative">
        <div
          className={`flex items-center justify-between px-2 py-1 rounded-md transition cursor-pointer select-none text-[11px] ${
            isActive
              ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-navy-900 text-white font-bold shadow-xs border border-blue-400/30'
              : 'text-slate-700 hover:bg-blue-100/70 hover:text-navy-950 font-medium'
          }`}
          onClick={() => {
            navigate(item.path);
            if (hasSubItems) {
              setExpandedMenus((prev) => ({
                [item.path]: !prev[item.path],
              }));
            } else {
              setExpandedMenus({});
              setSidebarOpen(false);
            }
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-blue-600'}`} />
            <span className="truncate leading-tight text-[11px]">{item.label}</span>
          </div>

          {hasSubItems && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedMenus((prev) => ({
                  [item.path]: !prev[item.path],
                }));
              }}
              className={`p-0.5 rounded transition ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-700'}`}
              title="Toggle Submenu Options"
            >
              <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90 text-amber-300' : ''}`} />
            </button>
          )}
        </div>

        {/* Floating Submenu Popover (Zero Vertical Scroll) */}
        {hasSubItems && isExpanded && (
          <div
            className={`absolute left-full ${
              isBottomHalf ? 'bottom-0' : 'top-0'
            } ml-2 w-64 z-50 bg-white rounded-xl shadow-2xl border border-blue-200/90 p-2 animate-in fade-in zoom-in-95 duration-150`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 border-b border-blue-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-900">
              <span className="truncate">{item.label}</span>
              <button
                type="button"
                onClick={() => setExpandedMenus((prev) => ({ ...prev, [item.path]: false }))}
                className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="py-1 max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
              {item.subItems.map((sub: any) => {
                const currentViewParam = new URLSearchParams(location.search).get('view');
                const isSubActive =
                  location.pathname.startsWith(item.path) &&
                  (currentViewParam === sub.view || (!currentViewParam && (sub.view === 'ALL' || sub.view === 'SUBMISSIONS' || sub.view === 'PROJECT_MILESTONES' || sub.view === 'PENDING_PAYOUTS' || sub.view === 'CUSTOMER_INVOICES' || sub.view === 'CUSTOMER_MESSAGES' || sub.view === 'CUSTOMER_COMPLAINTS' || sub.view === 'CUSTOMER_REPORTS' || sub.view === 'CUSTOMER_NOTIFICATIONS' || sub.view === 'HOMEPAGE_CONTENT' || sub.view === 'SERVICE_CATEGORIES' || sub.view === 'ADMIN_USERS' || sub.view === 'GENERAL_SETTINGS' || sub.view === 'ADMIN_ACTIVITY')));

                return (
                  <Link
                    key={sub.path}
                    to={sub.path}
                    onClick={() => {
                      setExpandedMenus({});
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition font-medium ${
                      isSubActive
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
                    }`}
                  >
                    <span className={`w-1 h-1 rounded-full shrink-0 ${isSubActive ? 'bg-amber-300' : 'bg-slate-300'}`} />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentRoleMeta = ADMIN_ROLE_DEFINITIONS[activeRole] || ADMIN_ROLE_DEFINITIONS.SUPER_ADMIN;
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
          {/* Active Admin Persona Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/80 transition text-xs font-bold text-navy-950 shadow-2xs cursor-pointer"
              title="Switch role mode to test permissions (Super Admin, Quotation Mgr, Finance Mgr, etc.)"
            >
              <span className={`w-2 h-2 rounded-full ${activeRole === 'SUPER_ADMIN' ? 'bg-purple-500' : 'bg-blue-500'} animate-pulse`} />
              <div className="text-left hidden md:block">
                <span className="text-[9px] text-slate-400 block uppercase font-mono leading-none">Role Mode</span>
                <span className="text-xs font-black text-navy-950">{currentRoleMeta.title.split(' ')[0]}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-blue-200/90 py-2 z-50 text-xs text-slate-800">
                <div className="px-3.5 py-2 border-b border-blue-100 bg-blue-50/50">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Admin Roles (8 Personas)</span>
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Switch perspective to test role permissions</div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                  {(Object.keys(ADMIN_ROLE_DEFINITIONS) as MasterAdminRole[]).map((r) => {
                    const meta = ADMIN_ROLE_DEFINITIONS[r];
                    const isSelected = activeRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setActiveAdminRole(r);
                          setActiveRoleState(r);
                          setRoleMenuOpen(false);
                          success(`Switched active view to ${meta.title}`);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 border border-blue-300 text-blue-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        <div>
                          <div className="font-bold text-xs text-navy-950">{meta.title}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{meta.department}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
        {/* Dedicated Admin Single-Column Zero-Scroll Sidebar */}
        <aside
          className={`admin-sidebar-container fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 sm:w-68 bg-gradient-to-b from-white via-[#f4f8fe] to-[#edf4fc] border-r border-blue-200/80 text-slate-700 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 shadow-xs ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Top Header & Quick Category Jump Pills */}
          <div className="border-b border-blue-200/80 bg-white/80 backdrop-blur-xs shrink-0">
            <div className="px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-navy-950">
                  Navigation
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                  31 Menus
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={expandAllSections}
                  title="Expand All Sections"
                  className="px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition cursor-pointer"
                >
                  Expand
                </button>
                <span className="text-slate-300 text-[10px]">|</span>
                <button
                  type="button"
                  onClick={collapseAllSections}
                  title="Collapse All Sections"
                  className="px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition cursor-pointer"
                >
                  Collapse
                </button>
              </div>
            </div>

            {/* Quick Category Jump Pills */}
            <div className="px-2 pb-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { label: 'Core', idx: 0 },
                { label: 'Users', idx: 1 },
                { label: 'Quotes', idx: 2 },
                { label: 'Projects', idx: 3 },
                { label: 'Finance', idx: 4 },
                { label: 'Ops', idx: 5 },
              ].map((pill) => {
                const isPillActive = Boolean(openSections[pill.idx]);
                return (
                  <button
                    key={pill.idx}
                    type="button"
                    onClick={() => {
                      setOpenSections({
                        0: false,
                        1: false,
                        2: false,
                        3: false,
                        4: false,
                        5: false,
                        [pill.idx]: true,
                      });
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                      isPillActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-blue-50/80 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single-Column Accordion Menu List (Zero Vertical Scroll) */}
          <div className="flex-1 p-2 space-y-1.5 overflow-y-auto lg:overflow-visible select-none scrollbar-thin">
            {navSections.map((sec, sIdx) => {
              const isOpen = Boolean(openSections[sIdx]);
              const hasActiveItem = sec.items.some((item) =>
                item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path)
              );

              return (
                <div
                  key={sIdx}
                  className={`rounded-xl border transition-all duration-150 ${
                    isOpen
                      ? 'border-blue-200 bg-white/95 shadow-xs'
                      : hasActiveItem
                      ? 'border-blue-200/80 bg-blue-50/50'
                      : 'border-slate-100 hover:border-blue-100 bg-white/60 hover:bg-white'
                  }`}
                >
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(sIdx)}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          hasActiveItem ? 'bg-blue-600' : 'bg-slate-300 group-hover:bg-blue-400'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-black tracking-tight truncate ${
                          isOpen
                            ? 'text-blue-950 font-black'
                            : hasActiveItem
                            ? 'text-blue-900 font-bold'
                            : 'text-slate-600 group-hover:text-slate-900'
                        }`}
                      >
                        {sec.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1 py-0.2 rounded">
                        {sec.items.length}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                          isOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Section Items */}
                  {isOpen && (
                    <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-blue-50 animate-in fade-in duration-100">
                      {sec.items.map((item: any, itemIdx: number) => {
                        const isBottomHalf = sIdx >= 4 || itemIdx >= 3;
                        return renderMenuItem(item, isBottomHalf);
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Slim Space-Saving Bottom Status Bar */}
          <div className="px-3 py-1.5 border-t border-blue-200/80 bg-white/80 backdrop-blur-xs flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-700">Atlas Online</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-900 font-semibold">RBAC Active</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-400">v1.0</span>
            </div>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-bold transition cursor-pointer text-[10px]"
              title="Log Out of Admin"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
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
