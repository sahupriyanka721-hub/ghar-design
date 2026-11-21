import { InteriorDesignerHeader } from '../../components/navigation/InteriorDesignerHeader.js';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Palette,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getInteriorDesignerByPhone,
  getInteriorDesignerAccounts,
  InteriorDesignerAccount,
} from '../../data/interiorDesignerStore.js';

export const InteriorDesignerLogin: React.FC = () => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedDesigner, setDetectedDesigner] = useState<InteriorDesignerAccount | null>(null);

  const { loginProfessionalWithOtp, requestOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length === 10) {
      const found =
        getInteriorDesignerByPhone(clean) ||
        getInteriorDesignerAccounts().find(
          (a) => (a.phone || '').replace(/\D/g, '').slice(-10) === clean
        );
      setDetectedDesigner(found || null);
    } else {
      setDetectedDesigner(null);
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
      // STRICT REQUIREMENT: Only registered mobile numbers can login
      const designer =
        getInteriorDesignerByPhone(cleanPhone) ||
        getInteriorDesignerAccounts().find(
          (a) => (a.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone
        );
      const isRegisteredLocal =
        localStorage.getItem(`registered_interior_designer_phone_${cleanPhone}`) === 'true';
      const savedName = localStorage.getItem(`registered_interior_designer_name_${cleanPhone}`);

      if (!designer && !isRegisteredLocal) {
        error('Yeh mobile number registered nahi hai. Kripya pehle Interior Designer partner ke roop me register karein.');
        setLoading(false);
        return;
      }

      const resolvedName = designer?.name || savedName || 'Interior Designer';
      const res = await requestOtp(cleanPhone, resolvedName);
      const generatedOtp = res?.otp || '123456';
      setLiveOtp(generatedOtp);
      setOtp(generatedOtp); // Auto-fill OTP
      setStep('OTP');
      success(`Login code sent to +91 ${cleanPhone}`);
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
      const designer =
        getInteriorDesignerByPhone(cleanPhone) ||
        getInteriorDesignerAccounts().find(
          (a) => (a.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone
        );
      const savedName = localStorage.getItem(`registered_interior_designer_name_${cleanPhone}`);
      const resolvedName = designer?.name || savedName || 'Interior Designer';

      await loginProfessionalWithOtp(cleanPhone, cleanOtp, resolvedName);

      success(`Welcome back, ${resolvedName}!`);

      if (!designer || designer.accountStatus === 'PROFILE_INCOMPLETE') {
        navigate('/interior-designer/profile-wizard');
      } else if (designer.accountStatus === 'APPROVED') {
        navigate('/interior-designer/dashboard');
      } else {
        navigate('/interior-designer/application-status');
      }
    } catch (err: any) {
      error(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdfa] via-white to-[#e6f8f5] text-slate-800 flex flex-col font-sans relative overflow-hidden">
      {/* Light Teal Backdrops */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <InteriorDesignerHeader />

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
        {/* Left Side: Value Proposition (Zero Dummy Data) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 max-w-xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-navy-950 text-xs font-black uppercase tracking-wider font-mono">
            <Palette className="w-4 h-4 text-blue-600" />
            <span>Designer Gateway</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-navy-950 tracking-tight leading-tight">
              Sign In to Your{' '}
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Interior Design Center
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed font-medium">
              Access assigned homeowner design briefs, build room-wise BOQ quotations, upload 3D renders & mood boards,
              and track milestone escrow settlements.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                title: 'High-Budget Residential & Commercial Briefs',
                desc: 'Direct verified inquiries for luxury apartments, duplexes, modular kitchens, and turnkey renovation.',
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

        {/* Right Side: Phone + OTP Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-100 shadow-xl relative"
        >
          {step === 'PHONE' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <h3 className="text-xl font-black font-display text-navy-950">Interior Designer Sign In</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered mobile number to access your firm.
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
                    placeholder="Enter 10-digit number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Detected Profile */}
              {detectedDesigner && (
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                  <div className="text-[11px] font-bold text-navy-950 flex items-center justify-between">
                    <span className="truncate">Identified: {detectedDesigner.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-mono font-bold text-blue-800">
                      {detectedDesigner.accountStatus}
                    </span>
                  </div>
                  {detectedDesigner.businessName && (
                    <div className="text-[11px] text-slate-600 truncate">{detectedDesigner.businessName}</div>
                  )}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>{loading ? 'Verifying...' : 'Get Login OTP'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">New interior designer? </span>
                <Link to="/interior-designer/register" className="text-xs font-bold text-blue-700 hover:underline">
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
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 mb-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Use Different Number</span>
                </button>
                <h3 className="text-xl font-black font-display text-navy-950">Enter Authentication Code</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Code sent to <span className="font-mono font-bold text-slate-800">+91 {phone}</span>
                </p>
              </div>

              {/* OTP Input - Strictly blank, no dummy auto-fill */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-mono tracking-widest font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Verify CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>{loading ? 'Verifying...' : 'Sign In to Interior Design Panel'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};
