import { savePlatformProfessional } from '../../data/customerStore.js';
import { pushToCloud } from '../../data/cloudSync.js';
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
  Building2,
  Mail,
  User,
  Sparkles,
  Lock,
  Clock,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  saveArchitectAccount,
  getArchitectByPhone,
  generateArchitectId,
  generateArchitectApplicationNumber,
  ARCHITECT_ID_PREFIX,
} from '../../data/architectStore.js';

export const ArchitectRegister: React.FC = () => {
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [firmName, setFirmName] = useState('');
  const [architectName, setArchitectName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [liveOtp, setLiveOtp] = useState('123456');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [coaCodeAgreed, setCoaCodeAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const { loginProfessionalWithOtp, requestOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (!firmName.trim()) {
      error('Please enter your firm / company name');
      return;
    }
    if (!architectName.trim()) {
      error('Please enter principal architect / full name');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      error('Please enter a valid professional email address');
      return;
    }
    if (!termsAgreed || !coaCodeAgreed) {
      error('Please accept the Terms of Partnership and Council of Architecture Code of Conduct');
      return;
    }

    setLoading(true);
    try {
      const res = await requestOtp(cleanPhone, architectName.trim());
      const generatedOtp = res.otp || '123456';
      setLiveOtp(generatedOtp);
      setOtp(generatedOtp); // Auto-fill OTP so user does not have to type manually
      setStep('OTP');
      setTimer(30);
      success(`Architect verification code sent to +91 ${cleanPhone}`);
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
    const registeredFirm = firmName.trim();
    const registeredArchName = architectName.trim();
    setLoading(true);

    try {
      // 1. Store registered name and firm in localStorage for fast local lookup
      try {
        localStorage.setItem(`registered_arch_name_${cleanPhone}`, registeredArchName);
        localStorage.setItem(`registered_arch_firm_${cleanPhone}`, registeredFirm);
        localStorage.setItem(`arch_name_${cleanPhone}`, registeredArchName);
        localStorage.setItem(`arch_firm_${cleanPhone}`, registeredFirm);
        localStorage.setItem('registered_arch_firm', registeredFirm);
        localStorage.setItem('registered_arch_name', registeredArchName);
        localStorage.setItem('auth_phone', cleanPhone);
      } catch (e) {}

      // Generate strict Architect ID standard: BG/Architech/XXXXXX (e.g. BG/Architech/000001)
      const newArchId = generateArchitectId('BG/Architech');

      // 2. Save directly into architect store with clear separation of Architect Person Name and Firm Name
      saveArchitectAccount({
        id: newArchId,
        applicationNumber: newArchId,
        userId: `usr-arch-${cleanPhone}`,
        name: registeredArchName,
        firmName: registeredFirm,
        phone: cleanPhone,
        email: email.trim(),
        accountStatus: 'PENDING_APPROVAL',
        isVerified: false,
        registeredAt: new Date().toISOString(),
      });

      // 3. Also register into platform professionals with distinct Architect Name and Firm Name
      savePlatformProfessional({
        id: newArchId,
        userId: `usr-arch-${cleanPhone}`,
        phone: `+91 ${cleanPhone}`,
        name: registeredArchName,
        firmName: registeredFirm,
        category: 'ARCHITECT',
        email: email.trim(),
        isVerified: false,
        verificationStatus: 'PENDING',
      });

      // Dispatch global events for instant reactive sync in admin panel
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: { id: newArchId } }));
        window.dispatchEvent(new CustomEvent('admin_global_refresh'));
      }

      // 4. Authenticate session with the exact architect person name
      await loginProfessionalWithOtp(cleanPhone, cleanOtp, registeredArchName);

      // 5. Push to cloud database
      pushToCloud().catch(() => {});

      success(`Welcome, ${registeredArchName}! Phone verified. Please complete your profile.`);
      navigate('/architect/profile-wizard');
    } catch (err: any) {
      error(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-white to-[#e8f3fc] text-slate-800 flex flex-col font-sans relative overflow-hidden">
      {/* Ambient Light-Blue Glow Circles */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <ArchitectHeader />

      {/* Main Registration Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
        {/* Left Side: Program Value & Highlights */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 max-w-xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-900 text-xs font-black uppercase tracking-wider font-mono">
            <Compass className="w-4 h-4 text-sky-600" />
            <span>Council of Architecture Partner Registration</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-navy-950 tracking-tight leading-tight">
              Join Delhi NCR's Premier{' '}
              <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                Architecture Network
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed font-medium">
              Gain verified homeowner design inquiries, access pre-funded escrow milestone payments, and streamline CAD
              & structural working drawings.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                title: 'High-Intent Landowner RFQs',
                desc: 'Verified residential plot owners ready to begin construction across Gurugram, Delhi, Noida & NCR.',
              },
              {
                title: '100% Escrow Milestone Payouts',
                desc: 'Milestone funds deposited by homeowners upfront before drawing release, guaranteeing zero non-payment risk.',
              },
              {
                title: 'Itemized BOQ Costing Engine',
                desc: 'Save hundreds of hours with dynamic concrete, rebar, finishing, and MEP calculation templates.',
              },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/95 border border-sky-100 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">{f.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0" />
            <span>
              Requires valid Council of Architecture (COA) registration or Civil Engineering degree credentials.
            </span>
          </div>
        </motion.div>

        {/* Right Side: Step-by-Step Registration Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 border-sky-100 shadow-xl relative"
        >
          {/* Step Progress Pill */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === 'DETAILS' ? 'bg-sky-600 text-white' : 'bg-emerald-500 text-white'
                }`}
              >
                {step === 'OTP' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </span>
              <span className="text-xs font-bold text-slate-700">Phone & Identity</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === 'OTP' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </span>
              <span className="text-xs font-bold text-slate-500">OTP Verification</span>
            </div>
          </div>

          {step === 'DETAILS' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <h3 className="text-xl font-black font-display text-navy-950">Architect Partner Sign Up</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your contact details to begin profile verification.
                </p>
              </div>

              {/* Firm / Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Firm / Company Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="Enter firm / company name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Principal Architect / Professional Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Principal Architect / Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={architectName}
                    onChange={(e) => setArchitectName(e.target.value)}
                    placeholder="Enter principal architect full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Indian Mobile Number <span className="text-rose-500">*</span>
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
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-medium focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Professional Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professional Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter professional email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Agreements Checkboxes */}
              <div className="pt-2 space-y-2 text-[11px] text-slate-600">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    I agree to the BuildGhar Partner Master Terms & 100% Escrow Milestone Payout Guidelines.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coaCodeAgreed}
                    onChange={(e) => setCoaCodeAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    I confirm holding a valid Council of Architecture (COA) registration or Civil Engineering license.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>{loading ? 'Dispatching OTP...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already registered? </span>
                <Link to="/architect/login" className="text-xs font-bold text-sky-700 hover:underline">
                  Sign In →
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Details</span>
                </button>
                <h3 className="text-xl font-black font-display text-navy-950">Verify Mobile OTP</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sent 6-digit verification code to <span className="font-mono font-bold text-slate-800">+91 {phone}</span>
                </p>
              </div>

              {/* Quick Auto-fill Notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Test OTP Code: <strong className="font-mono">{liveOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(liveOtp)}
                  className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950"
                >
                  Auto-fill
                </button>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit OTP Code
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-mono tracking-widest font-bold focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Resend OTP:</span>
                {timer > 0 ? (
                  <span className="font-mono font-bold text-sky-700">00:{timer < 10 ? `0${timer}` : timer}</span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
                      const res = await requestOtp(cleanPhone, architectName.trim() || firmName.trim());
                      const freshOtp = res?.otp || '123456';
                      setLiveOtp(freshOtp);
                      setOtp(freshOtp); // Auto-fill fresh OTP
                      setTimer(30);
                      success(`New verification code: ${freshOtp}`);
                    }}
                    className="font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    Resend Code Now
                  </button>
                )}
              </div>

              {/* Verify CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>{loading ? 'Verifying...' : 'Verify OTP & Continue'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};
