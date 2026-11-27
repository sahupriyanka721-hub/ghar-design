import { InteriorDesignerHeader } from '../../components/navigation/InteriorDesignerHeader.js';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Palette,
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  User,
  Sparkles,
  Lock,
  Building2,
  Clock,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { saveInteriorDesignerAccount, getInteriorDesignerByPhone } from '../../data/interiorDesignerStore.js';

export const InteriorDesignerRegister: React.FC = () => {
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [liveOtp, setLiveOtp] = useState('123456');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const { loginProfessionalWithOtp, requestOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

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

    if (!name.trim()) {
      error('Please enter your full name or principal designer name');
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
    if (!termsAgreed) {
      error('Please accept the BuildGhar Professional Terms & Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const res = await requestOtp(cleanPhone, name.trim());
      const generatedOtp = res.otp || '123456';
      setLiveOtp(generatedOtp);
      setOtp(generatedOtp); // Auto-fill OTP
      setStep('OTP');
      setTimer(30);
      success(`Verification code dispatched to +91 ${cleanPhone}`);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (failedAttempts >= 5) {
      error('Maximum verification attempts exceeded. Please request a new OTP.');
      return;
    }

    if (otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      error('Please enter a valid 6-digit numeric OTP');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    setLoading(true);

    try {
      await loginProfessionalWithOtp(cleanPhone, otp.trim(), name.trim());

      localStorage.setItem(`registered_interior_designer_phone_${cleanPhone}`, 'true');
      localStorage.setItem(`registered_interior_designer_name_${cleanPhone}`, name.trim());

      const existing = getInteriorDesignerByPhone(cleanPhone);
      if (!existing) {
        saveInteriorDesignerAccount({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim(),
          accountStatus: 'PROFILE_INCOMPLETE',
          registeredAt: new Date().toISOString(),
        });
      }

      success(`Phone verified! Please complete your Interior Design Center profile wizard.`);
      navigate('/interior-designer/profile-wizard');
    } catch (err: any) {
      setFailedAttempts((prev) => prev + 1);
      error(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const res = await requestOtp(cleanPhone, name.trim());
      const generatedOtp = res.otp || '123456';
      setLiveOtp(generatedOtp);
      setOtp(generatedOtp);
      setTimer(30);
      setFailedAttempts(0);
      success(`New verification code sent to +91 ${cleanPhone}`);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdfa] via-white to-[#e6f8f5] text-slate-800 flex flex-col font-sans relative overflow-hidden">
      {/* Ambient Teal Backdrops */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <InteriorDesignerHeader />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
        {/* Left Side: Program Value */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 max-w-xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-navy-950 text-xs font-black uppercase tracking-wider font-mono">
            <Palette className="w-4 h-4 text-blue-600" />
            <span>Interior Design Professional Onboarding</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-navy-950 tracking-tight leading-tight">
              Join BuildGhar as an{' '}
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Interior Design Professional
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed font-medium">
              Submit your business profile, upload 3D renders, connect with verified property owners across Delhi NCR,
              and secure pre-funded escrow milestone payments.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                title: 'High-Budget Residential & Commercial Briefs',
                desc: 'Direct inquiries for full-home interiors, luxury living rooms, and bespoke modular kitchens.',
              },
              {
                title: '100% Escrow Milestone Funding',
                desc: 'Design and execution fees pre-funded by customers into escrow before site work commences.',
              },
              {
                title: 'Room-Wise BOQ Costing Engine',
                desc: 'Itemize carpentry, false ceilings, lighting, and finishes with clean tax schedules.',
              },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/95 border border-blue-100 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">{f.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-navy-950 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
            <span>
              Supports Individual Designers, Freelance Stylists, Design Centers, and Interior Architecture Firms.
            </span>
          </div>
        </motion.div>

        {/* Right Side: Step Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-100 shadow-xl relative"
        >
          {/* Step Progress Pill */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === 'DETAILS' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'
                }`}
              >
                {step === 'OTP' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </span>
              <span className="text-xs font-bold text-slate-700">Mobile & Identity</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === 'OTP' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
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
                <h3 className="text-xl font-black font-display text-navy-950">Interior Designer Sign Up</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your mobile number to begin Professional Profile onboarding.
                </p>
              </div>

              {/* Lead Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lead Designer / Principal Architect Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
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
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Email */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Agreements */}
              <div className="pt-2 text-[11px] text-slate-600">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    I agree to the BuildGhar Professional Partner Terms & Conditions, 100% Escrow Milestone Payout Guidelines, and Privacy Policy.
                  </span>
                </label>
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>{loading ? 'Dispatching OTP...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already registered? </span>
                <Link to="/interior-designer/login" className="text-xs font-bold text-blue-700 hover:underline">
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
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Mobile Number</span>
                </button>
                <h3 className="text-xl font-black font-display text-navy-950">Verify Mobile OTP</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sent 6-digit verification code to <span className="font-mono font-bold text-slate-800">+91 {phone}</span>
                </p>
              </div>

              {/* OTP Input with Live Helper Pill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Enter 6-Digit OTP Code <span className="text-rose-500">*</span>
                  </label>
                  {liveOtp && (
                    <button
                      type="button"
                      onClick={() => setOtp(liveOtp)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] font-bold hover:bg-blue-100 transition"
                      title="Click to auto-fill verification code"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Code: {liveOtp}</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-mono tracking-widest font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {timer > 0 ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Resend in <strong className="font-mono text-blue-700">00:{timer < 10 ? `0${timer}` : timer}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </span>
                {failedAttempts > 0 && (
                  <span className="text-rose-600 font-semibold text-[11px]">
                    Attempts: {failedAttempts}/5
                  </span>
                )}
              </div>

              {/* Verify CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>{loading ? 'Verifying...' : 'Verify OTP & Open Profile Wizard'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};
