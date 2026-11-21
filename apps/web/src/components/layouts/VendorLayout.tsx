import { VendorHeader } from '../navigation/VendorHeader.js';
import { VendorLandingPage } from '../../pages/public/VendorLandingPage.js';
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { BrandLogo } from '../common/BrandLogo.js';
import { SectionErrorBoundary } from '../common/SectionErrorBoundary.js';
import { getVendorByPhone } from '../../data/vendorStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  Package,
  Layers,
  Award,
  Boxes,
  ShoppingBag,
  Truck,
  Receipt,
  CreditCard,
  Percent,
  Users,
  BarChart3,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Building,
  Phone,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
} from 'lucide-react';

/**
 * VendorAuthGate
 * Dedicated, isolated Materials Vendor Depot Login Screen.
 * Mobile Number + OTP Verification for authorized suppliers.
 */
const VendorAuthGate: React.FC = () => {
  const { user, logout, loginVendorWithOtp, requestOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [liveOtp, setLiveOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedVendor, setDetectedVendor] = useState<any>(null);

  useEffect(() => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      const found = getVendorByPhone(clean);
      setDetectedVendor(found || null);
    } else {
      setDetectedVendor(null);
    }
  }, [phone]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const found = getVendorByPhone(cleanPhone);
    const vendorName = found?.ownerName || found?.businessName || 'Vendor Partner';

    setLoading(true);
    try {
      const res = await requestOtp(cleanPhone, vendorName);
      const activeOtp = res.otp || '123456';
      setLiveOtp(activeOtp);
      setOtp(activeOtp);
      setStep('OTP');
      success(`Vendor verification OTP generated: ${activeOtp}`);
    } catch {
      error('Failed to dispatch verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      error('Please enter 6-digit numeric OTP');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const found = getVendorByPhone(cleanPhone);
    const vendorName = found?.businessName || found?.ownerName || 'Verified Vendor Partner';

    setLoading(true);
    try {
      await loginVendorWithOtp(cleanPhone, otp.trim(), vendorName);
      success(`Welcome to BuildGhar Vendor Depot, ${vendorName}!`);
      navigate('/vendor');
    } catch (err: any) {
      error(err.message || 'Invalid Vendor OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf4fc] via-[#f7faff] to-[#edf4fc]/80 flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-4"
      >
        <div className="flex justify-between items-center mb-2">
            <Link
              to="/vendor"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-950 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Supplier Overview</span>
            </Link>
            <Link
              to="/vendor/register"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 transition"
            >
              Register &rarr;
            </Link>
          </div>
          <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-950 to-blue-900 text-gold-400 flex items-center justify-center mx-auto shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-950 font-mono text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Vendor Depot Operations
            </span>
            <h1 className="text-2xl font-black font-display text-navy-950 mt-1">
              Vendor Partner Sign In
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure Mobile Number & OTP Verification
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-sky-200/90 p-6 sm:p-7 shadow-[0_15px_35px_rgba(14,165,233,0.12)] space-y-5">
          {step === 'PHONE' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-navy-950" />
                  <span>Registered Business Mobile Number</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-12 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-navy-900 focus:bg-white transition"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {detectedVendor && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold mt-2.5 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Registered Firm: <strong>{detectedVendor.businessName}</strong> ({detectedVendor.city})
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length !== 10}
                className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Sending Code...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50/70 border-2 border-sky-300 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                  <KeyRound className="w-3 h-3 text-amber-600" />
                  <span>Live Verification OTP</span>
                </span>
                <div className="text-3xl font-black font-mono tracking-widest text-navy-950 py-0.5">
                  {liveOtp}
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] pt-0.5">
                  <span className="text-slate-500">Dispatched to +91 {phone.replace(/\D/g, '').slice(-10)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(liveOtp);
                      success('OTP Auto-filled!');
                    }}
                    className="px-2 py-0.5 bg-navy-950 text-gold-400 rounded text-[10px] font-bold"
                  >
                    Auto-fill
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder=""
                  className="w-full py-2.5 text-center text-lg font-mono font-bold tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:border-navy-900 focus:bg-white"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-slate-500 hover:text-navy-950 font-bold underline"
                >
                  Change Number
                </button>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-blue-700 font-bold hover:underline"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Verify & Enter Vendor Depot'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Want to sell materials on BuildGhar?</span>
            <Link to="/vendor/register" className="text-navy-950 font-bold hover:underline">
              Register as Supplier
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Main Vendor Layout & Navigation Shell
 */
export const VendorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const vendorRecord = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  // Strict role check: If not logged in as VENDOR, show Vendor landing page or auth gate
  if (!user || user.role !== 'VENDOR') {
    const showLoginGate =
      location.pathname === '/vendor/login' ||
      location.pathname === '/vendor/login/' ||
      location.search.includes('login') ||
      (location.pathname !== '/vendor' && location.pathname !== '/vendor/');

    return (
      <div className="min-h-screen flex flex-col bg-transparent relative overflow-x-hidden w-full">
        <VendorHeader />
        <main className="flex-grow">
          {showLoginGate ? <VendorAuthGate /> : <VendorLandingPage />}
        </main>
      </div>
    );
  }

  // Complete 16 Sidebar Modules (Section 4)
  const navSections = [
    {
      group: 'Core Operations',
      items: [
        { label: 'Dashboard', path: '/vendor', icon: LayoutDashboard, exact: true },
        { label: 'Business Profile', path: '/vendor/profile', icon: Store },
        { label: 'Product Catalog', path: '/vendor/products', icon: Package },
        { label: 'Category Management', path: '/vendor/categories', icon: Layers },
        { label: 'Brand Management', path: '/vendor/brands', icon: Award },
        { label: 'Inventory Management', path: '/vendor/inventory', icon: Boxes },
      ],
    },
    {
      group: 'Fulfillment & Logistics',
      items: [
        { label: 'Order Management', path: '/vendor/orders', icon: ShoppingBag },
        { label: 'Shipping & Delivery', path: '/vendor/delivery', icon: Truck },
        { label: 'Billing & Invoices', path: '/vendor/billing', icon: Receipt },
        { label: 'Payments & Settlement', path: '/vendor/payments', icon: CreditCard },
      ],
    },
    {
      group: 'Growth & Insights',
      items: [
        { label: 'Offers & Promotions', path: '/vendor/promotions', icon: Percent },
        { label: 'Customer Management', path: '/vendor/customers', icon: Users },
        { label: 'Reports & Analytics', path: '/vendor/reports', icon: BarChart3 },
      ],
    },
    {
      group: 'System & Support',
      items: [
        { label: 'Notifications', path: '/vendor/notifications', icon: Bell },
        { label: 'Support & Help', path: '/vendor/support', icon: HelpCircle },
        { label: 'Settings', path: '/vendor/settings', icon: Settings },
      ],
    },
  ];

  const isApproved = vendorRecord?.status === 'APPROVED' || !vendorRecord; // fallback allowed

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf4fc] via-[#f7faff] to-[#edf4fc]/70 flex flex-col font-sans">

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-blue-200/80 shadow-2xs h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle Vendor Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            to="/vendor"
            className="flex items-center gap-2.5 py-1 px-3 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border border-blue-200 shadow-2xs"
          >
            <BrandLogo size="sm" />
            <span className="px-2.5 py-0.5 bg-sky-100/90 border border-sky-200 text-sky-900 font-mono text-[10px] font-black rounded-full uppercase tracking-wider hidden sm:inline-block">
              Vendor Panel
            </span>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/materials"
            target="_blank"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
          >
            <span>Live Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* KYC Status Badge */}
          <div className="flex items-center gap-2">
            {isApproved ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Supplier</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-full text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>KYC Under Review</span>
              </span>
            )}
          </div>

          {/* Notifications Shortcut */}
          <Link
            to="/vendor/notifications"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          </Link>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-navy-950 leading-tight">
                {vendorRecord?.businessName || user.name || 'Vendor Depot'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                +91 {user.phone}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/vendor');
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* BODY WITH RESPONSIVE SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/95 backdrop-blur-xl border-r border-blue-200/80 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-[10px] font-black uppercase tracking-wider text-sky-800/80">
                  {sec.group}
                </div>
                <div className="space-y-0.5">
                  {(sec.items || []).map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? 'bg-navy-950 text-gold-400 shadow-xs'
                            : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100/80'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-blue-100 bg-sky-50/60">
            <div className="p-2.5 bg-white/95 border border-blue-200/80 rounded-xl text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <span>Standard Commission:</span>
                <span className="text-emerald-700 font-mono">{vendorRecord?.commissionRatePercent || 5}%</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Direct bank settlement via automated escrow tranches.
              </div>
            </div>
          </div>
        </aside>

        {/* OVERLAY FOR MOBILE */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* MAIN OUTLET CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <SectionErrorBoundary sectionName="Vendor Workspace" fallbackUrl="/vendor">
            <Outlet />
          </SectionErrorBoundary>
          </div>
        </main>
      </div>

    </div>
  );
};
