import { ArchitectHeader } from '../../components/navigation/ArchitectHeader.js';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Building2,
  Clock,
  AlertTriangle,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getArchitectByPhone, SEED_ARCHITECTS, ArchitectAccount } from '../../data/architectStore.js';

export const ArchitectLogin: React.FC = () => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [liveOtp, setLiveOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [detectedArch, setDetectedArch] = useState<ArchitectAccount | null>(null);

  const { loginProfessionalWithOtp, requestOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Detect architect by phone
  useEffect(() => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length === 10) {
      const found = getArchitectByPhone(clean);
      setDetectedArch(found || null);
    } else {
      setDetectedArch(null);
    }
  }, [phone]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const arch = getArchitectByPhone(cleanPhone);
      const savedName = localStorage.getItem(`registered_arch_name_${cleanPhone}`);
      const resolvedName = arch?.name || savedName || '';

      const res = await requestOtp(cleanPhone, resolvedName);
      const generatedOtp = res.otp || '123456';
      setLiveOtp(generatedOtp);
      setOtp(generatedOtp); // Auto-fill OTP so user does not need to type manually
      setStep('OTP');
      success(`Verification code sent to +91 ${cleanPhone}`);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      error('Please enter a valid 6-digit numeric OTP');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const arch = getArchitectByPhone(cleanPhone);
      const savedName = localStorage.getItem(`registered_arch_name_${cleanPhone}`);
      const resolvedName = arch?.name || savedName || '';

      await loginProfessionalWithOtp(cleanPhone, cleanOtp, resolvedName);

      if (resolvedName) {
        success(`Welcome back, ${resolvedName}!`);
      } else {
        success('Phone verified! Please complete your architecture profile.');
      }

      if (arch && arch.accountStatus === 'APPROVED') {
        navigate('/professional');
      } else {
        navigate('/architect/profile-wizard');
      }
    } catch (err: any) {
      error(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (cleanPhone: string, testName: string) => {
    setLoading(true);
    try {
      await loginProfessionalWithOtp(cleanPhone, '123456', testName);
      const arch = getArchitectByPhone(cleanPhone);
      success(`Logged in as ${testName}`);

      if (!arch || arch.accountStatus === 'PROFILE_INCOMPLETE') {
        navigate('/architect/profile-wizard');
      } else if (arch.accountStatus === 'APPROVED') {
        navigate('/professional');
      } else {
        navigate('/architect/application-status');
      }
    } catch (err: any) {
      error(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-white to-[#e8f3fc] text-slate-800 flex flex-col font-sans relative overflow-hidden">
      {/* Light Blue Ambient Backdrops */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <ArchitectHeader />

      {/* Main Login Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
        {/* Left Side: Test Presets & Features */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 max-w-xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-900 text-xs font-black uppercase tracking-wider font-mono">
            <Compass className="w-4 h-4 text-sky-600" />
            <span>Architect Gateway</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-navy-950 tracking-tight leading-tight">
              Sign In to Your{' '}
              <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                Design Center
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed font-medium">
              Access assigned landowner blueprints, build itemized BOQ estimations, manage CAD revisions, and track
              milestone payouts.
            </p>
          </div>

          </motion.div>

        {/* Right Side: Phone + OTP Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 border-sky-100 shadow-xl relative"
        >
          {step === 'PHONE' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <h3 className="text-xl font-black font-display text-navy-950">Architect Sign In</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered mobile number to receive an authentication code.
                </p>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-medium focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>{loading ? 'Sending Code...' : 'Get Login OTP'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">New architect partner? </span>
                <Link to="/architect/register" className="text-xs font-bold text-sky-700 hover:underline">
                  Register Your Practice →
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Use Different Number</span>
                </button>
                <h3 className="text-xl font-black font-display text-navy-950">Enter Authentication Code</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Code sent to <span className="font-mono font-bold text-slate-800">+91 {phone}</span>
                </p>
              </div>

              {/* Auto-fill OTP Option */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold">
                    OTP Code: <strong className="font-mono text-sm text-amber-950 font-black">{liveOtp || '123456'}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(liveOtp || '123456')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-fill OTP</span>
                </button>
              </div>

              {/* OTP Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Enter 6-Digit OTP <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder=""
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-mono tracking-widest font-bold focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Verify CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>{loading ? 'Verifying...' : 'Sign In to Architecture Panel'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};
