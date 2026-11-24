import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Store,
  HardHat,
  Home,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  getCustomerByPhone,
  getAdminByPhone,
  getProfessionalByPhone,
  getRegisteredCustomers,
} from '../../data/customerStore.js';
import { getVendorByPhone, getRegisteredVendors } from '../../data/vendorStore.js';
import { getSubdomain } from '../../lib/subdomain.js';

type LoginRole = 'CUSTOMER' | 'PROFESSIONAL' | 'VENDOR' | 'ADMIN';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role')?.toUpperCase();
  const subdomain = getSubdomain();
  const defaultRoleForSubdomain: LoginRole =
    subdomain === 'admin'
      ? 'ADMIN'
      : subdomain === 'vendor'
      ? 'VENDOR'
      : subdomain === 'architect' || subdomain === 'interior'
      ? 'PROFESSIONAL'
      : 'CUSTOMER';

  const validInitialRole: LoginRole =
    initialRoleParam === 'ADMIN'
      ? 'ADMIN'
      : initialRoleParam === 'VENDOR'
      ? 'VENDOR'
      : initialRoleParam === 'PROFESSIONAL'
      ? 'PROFESSIONAL'
      : initialRoleParam === 'CUSTOMER'
      ? 'CUSTOMER'
      : defaultRoleForSubdomain;

  const [activeRole, setActiveRole] = useState<LoginRole>(validInitialRole);

  const {
    user,
    logout,
    loginWithOtp,
    loginAdminWithOtp,
    loginVendorWithOtp,
    loginProfessionalWithOtp,
    requestOtp,
  } = useAuth();

  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [liveOtp, setLiveOtp] = useState('');
  const [detectedUser, setDetectedUser] = useState<{
    type: LoginRole;
    name: string;
    details?: string;
  } | null>(null);
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Detect registered user without forcefully hijacking the selected activeRole
  useEffect(() => {
    const raw = phone.replace(/\D/g, '').slice(-10);
    if (raw.length === 10) {
      // Check customer profile
      const custAcc = getCustomerByPhone(raw);
      if (custAcc) {
        if (!name) setName(custAcc.name);
        setDetectedUser({
          type: 'CUSTOMER',
          name: custAcc.name,
          details: `${custAcc.city || 'Homeowner Site'} • Verified`,
        });
        setIsUnregistered(false);
        return;
      }

      // Check partner profiles if user is on those tabs
      if (activeRole === 'ADMIN') {
        const adminAcc = getAdminByPhone(raw);
        if (adminAcc) {
          if (!name) setName(adminAcc.name);
          setDetectedUser({
            type: 'ADMIN',
            name: adminAcc.name,
            details: adminAcc.department || 'Super Administrator',
          });
          setIsUnregistered(false);
          return;
        }
      }

      if (activeRole === 'PROFESSIONAL') {
        const proAcc = getProfessionalByPhone(raw);
        if (proAcc) {
          if (!name) setName(proAcc.name);
          setDetectedUser({
            type: 'PROFESSIONAL',
            name: proAcc.name,
            details: `${proAcc.firmName} • Verified Partner`,
          });
          setIsUnregistered(false);
          return;
        }
      }

      if (activeRole === 'VENDOR') {
        const vendorAcc = getVendorByPhone(raw);
        if (vendorAcc) {
          if (!name) setName(vendorAcc.ownerName);
          setDetectedUser({
            type: 'VENDOR',
            name: vendorAcc.businessName,
            details: `${vendorAcc.ownerName} • Verified Depot`,
          });
          setIsUnregistered(false);
          return;
        }
      }

      setDetectedUser(null);
      setIsUnregistered(false);
    } else {
      setDetectedUser(null);
      setIsUnregistered(false);
    }
  }, [phone, activeRole]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const adminAcc = getAdminByPhone(cleanPhone);
    const proAcc = getProfessionalByPhone(cleanPhone);
    const vendorAcc = getVendorByPhone(cleanPhone);
    const custAcc = getCustomerByPhone(cleanPhone);

    // For customers, allow instant OTP generation and auto-onboarding
    const registeredName =
      (activeRole === 'CUSTOMER'
        ? (custAcc?.name || name.trim() || 'Homeowner')
        : activeRole === 'ADMIN'
        ? (adminAcc?.name || name.trim() || 'Super Administrator')
        : activeRole === 'PROFESSIONAL'
        ? (proAcc?.name || name.trim() || 'Partner Professional')
        : (vendorAcc?.ownerName || name.trim() || 'Vendor Partner'));

    if (name.trim()) {
      const inputNorm = name.trim().toLowerCase();
      const regNorm = registeredName.trim().toLowerCase();
      if (registeredName && !regNorm.includes(inputNorm) && !inputNorm.includes(regNorm)) {
        error(`Using your registered name: ${registeredName}`);
        setName(registeredName);
      }
    } else {
      setName(registeredName);
    }

    setLoading(true);
    try {
      const res = await requestOtp(cleanPhone, registeredName);
      const activeOtp = res.otp || '123456';
      setLiveOtp(activeOtp);
      setOtp(activeOtp); // Automatically fetch OTP into input field
      setStep('OTP');
      success(`OTP Auto-Fetched: ${activeOtp}`);
    } catch (err: any) {
      error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = (otp || '').trim();
    if (cleanOtp.length !== 6) {
      error('Please enter a 6-digit numeric OTP');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const adminAcc = getAdminByPhone(cleanPhone);
      const proAcc = getProfessionalByPhone(cleanPhone);
      const vendorAcc = getVendorByPhone(cleanPhone);
      const custAcc = getCustomerByPhone(cleanPhone);

      if (activeRole === 'ADMIN') {
        const adminName = adminAcc?.name || name.trim() || 'Super Administrator';
        await loginAdminWithOtp(cleanPhone, cleanOtp, adminName);
        success(`Welcome Super Admin, ${adminName}!`);
        window.location.href = '/admin';
      } else if (activeRole === 'PROFESSIONAL') {
        const proName = proAcc?.name || name.trim() || 'Partner Professional';
        await loginProfessionalWithOtp(cleanPhone, cleanOtp, proName);
        success(`Welcome Partner, ${proName}!`);
        window.location.href = '/professional';
      } else if (activeRole === 'VENDOR') {
        const vName = vendorAcc?.ownerName || name.trim() || 'Vendor Partner';
        await loginVendorWithOtp(cleanPhone, cleanOtp, vName);
        success(`Welcome ${vendorAcc?.businessName || vName}!`);
        window.location.href = '/vendor';
      } else {
        // CUSTOMER - Guaranteed customer workspace
        const custName = custAcc?.name || name.trim() || 'Homeowner';
        await loginWithOtp(cleanPhone, cleanOtp, custName);
        success(`Welcome to Customer Desk, ${custName}!`);
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };


  const roleMeta = {
    CUSTOMER: {
      title: 'Customer & Homeowner Portal',
      subtitle: 'Track your home construction, approve drawings, inspect materials & pay milestone escrow.',
      targetDashboard: '/dashboard',
      dashboardLabel: 'Homeowner Workspace (/dashboard)',
      color: 'emerald',
      badge: 'Homeowner Account',
      icon: Home,
    },
    PROFESSIONAL: {
      title: 'Contractor & Engineering Workspace',
      subtitle: 'Receive client briefs, submit itemized BOQ quotations, and manage site execution milestones.',
      targetDashboard: '/professional',
      dashboardLabel: 'Partner Workspace (/professional)',
      color: 'blue',
      badge: 'Associate Professional',
      icon: HardHat,
    },
    VENDOR: {
      title: 'Building Materials Vendor Depot',
      subtitle: 'Manage building supplies catalog, track customer truck dispatches, and receive weekly payouts.',
      targetDashboard: '/vendor',
      dashboardLabel: 'Vendor Depot (/vendor)',
      color: 'amber',
      badge: 'Materials Supply Depot',
      icon: Store,
    },
    ADMIN: {
      title: 'Super Admin Operations Console',
      subtitle: 'Review customer inquiries, approve vendors & materials, publish verified quotes, and inspect audit logs.',
      targetDashboard: '/admin',
      dashboardLabel: 'Super Admin Console (/admin)',
      color: 'sky',
      badge: 'Platform Administrator',
      icon: ShieldCheck,
    },
  };

  const currentMeta = roleMeta[activeRole];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50 font-sans">
      <div className="max-w-xl w-full space-y-5">
        {/* Dedicated Homeowner Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold font-display uppercase tracking-wider shadow-2xs">
            <Home className="w-3.5 h-3.5 text-emerald-600" />
            <span>Homeowner & Customer Sign In</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Sign In to Customer Desk
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Enter your 10-digit mobile number to track construction, review quotations, inspect materials & pay milestone escrow.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
          {step === 'PHONE' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter your registered name"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Registered Indian Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    className="input-field pl-12 font-mono text-slate-900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {detectedUser ? (
                  <div className="flex items-center gap-2 font-semibold text-xs mt-2.5 p-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Detected {detectedUser.type}: <strong>{detectedUser.name}</strong>
                      {detectedUser.details && (
                        <span className="opacity-80 font-normal ml-1">({detectedUser.details})</span>
                      )}
                    </span>
                  </div>
                ) : activeRole === 'ADMIN' && phone.replace(/\D/g, '').length === 10 ? (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 mt-2.5 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sky-900">
                      <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Admin Mobile Verification Ready</span>
                    </div>
                    <p className="text-[11px] text-sky-700">
                      Aapka yeh mobile number verify karke seedhe Super Admin Console me login karwaya jayega.
                    </p>
                  </div>
                ) : isUnregistered ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 mt-2.5 space-y-2">
                    <div className="flex items-start gap-2 font-bold text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>+91 {phone} is not registered yet.</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Please create an account first or sign up to access this dashboard.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the 10-digit mobile number linked to your {currentMeta.badge}.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (activeRole !== 'ADMIN' && isUnregistered) || phone.replace(/\D/g, '').length !== 10}
                className="btn-gold w-full py-3 text-xs font-bold font-display flex items-center justify-center gap-2 rounded-xl shadow-md disabled:opacity-50 transition"
              >
                <span>
                  {loading
                    ? 'Sending OTP Code...'
                    : activeRole === 'ADMIN'
                    ? 'Send Admin Verification OTP'
                    : 'Send Verification OTP'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Prominent Live Screen OTP Box */}
              <div className="p-4 bg-gradient-to-br from-amber-50 via-gold-50/80 to-amber-100/70 border-2 border-gold-400 rounded-2xl text-center space-y-1.5 shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Your Verification OTP</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-[0.35em] text-navy-950 py-1.5 select-all bg-white/85 rounded-xl border border-gold-300 shadow-2xs">
                  {liveOtp || sessionStorage.getItem(`live_otp_${phone.replace(/\D/g, '').slice(-10)}`) || '123456'}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-amber-950 font-semibold">
                  <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md font-bold text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Auto-Fetched</span>
                  </span>
                  <span>Sent to: +91 {phone.replace(/\D/g, '').slice(-10)}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
                      try {
                        const res = await requestOtp(cleanPhone, name);
                        const freshOtp = res.otp || '123456';
                        setLiveOtp(freshOtp);
                        setOtp(freshOtp);
                        success(`New OTP Auto-Fetched: ${freshOtp}`);
                      } catch {
                        error('Failed to regenerate OTP');
                      }
                    }}
                    className="text-navy-950 hover:underline font-bold text-[11px]"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('PHONE');
                      setOtp('');
                      setLiveOtp('');
                      setName('');
                      setDetectedUser(null);
                    }}
                    className="text-[11px] text-gold-600 font-bold hover:underline"
                  >
                    Change Mobile
                  </button>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="input-field tracking-[0.3em] text-center text-lg font-bold font-mono py-3"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary w-full py-3 text-xs font-bold font-display flex items-center justify-center gap-2 rounded-xl shadow-md transition"
              >
                <span>{loading ? 'Verifying OTP...' : `Enter ${currentMeta.title}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Active Session Warning & 1-Click Logout */}
          {user && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-950 shadow-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Currently Signed In: {user.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-[10px] uppercase font-mono font-black">
                    {user?.role}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  To log in with a different role, please reset your existing session first.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  success('Logged out successfully. All sessions cleared.');
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
              >
                Sign Out
              </button>
            </div>
          )}


          {/* Registration Links Footer */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">Need to create a homeowner account?</span>
            <div className="flex items-center gap-3">
              <Link to="/signup" className="text-navy-950 font-bold hover:underline">
                Customer Sign Up
              </Link>
            </div>
          </div>
        </div>

        {/* Dedicated Separate Dashboards Gateway Cards */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 font-display">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Looking for an Associate Partner Portal?</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <Link
              to="/professional"
              className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-100/70 transition flex flex-col justify-between gap-2 group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <HardHat className="w-4 h-4" />
                </div>
                <span className="font-bold text-blue-950 text-sm">Partner Workspace</span>
              </div>
              <p className="text-[11px] text-blue-800/80 leading-snug">
                Assigned homeowner RFQs, BOQ builder & execution →
              </p>
            </Link>

            <Link
              to="/vendor"
              className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition flex flex-col justify-between gap-2 group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <span className="font-bold text-amber-950 text-sm">Vendor Depot</span>
              </div>
              <p className="text-[11px] text-amber-800/80 leading-snug">
                Material catalog, direct supply orders & logistics →
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

