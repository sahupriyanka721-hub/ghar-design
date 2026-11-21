import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSignupSchema, CustomerSignupInput } from '@ghar-design/shared';
import { useAuth } from '../../context/AuthContext.js';
import { SearchableCitySelect } from '../../components/common/SearchableCitySelect.js';
import { ShieldCheck, CheckCircle2, ArrowRight, Phone, User, Home, MapPin, Mail, Key } from 'lucide-react';

export const CustomerSignup: React.FC = () => {
  const navigate = useNavigate();
  const { signupWithOtp, isLoading } = useAuth();
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [formData, setFormData] = useState<CustomerSignupInput | null>(null);
  const [otp, setOtp] = useState('');
  const [liveOtp, setLiveOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerSignupInput>({
    resolver: zodResolver(customerSignupSchema),
    defaultValues: {
      fullName: '',
      mobileNumber: '',
      alternateContact: '',
      email: '',
      housePlotNumber: '',
      streetLocality: '',
      country: 'India',
      state: '',
      city: '',
      pinCode: '',
    },
  });

  const selectedCity = watch('city');
  const watchedState = watch('state');
  const watchedPinCode = watch('pinCode');

  const onDetailsSubmit = (data: CustomerSignupInput) => {
    const raw = (data.mobileNumber || '').replace(/\D/g, '').slice(-10);
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`live_otp_${raw}`, generated);
    sessionStorage.setItem(`admin_live_otp_${raw}`, generated);
    sessionStorage.setItem('last_generated_otp', generated);
    setLiveOtp(generated);
    setOtp(generated); // Automatically fetch OTP into input field
    setFormData(data);
    setStep('OTP');
    setResendTimer(30);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    const cleanOtp = (otp || '').trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setOtpError('');
      await signupWithOtp(formData, cleanOtp);
      navigate('/dashboard');
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed. Please enter the valid 6-digit code.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-navy-950 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-400/40 text-gold-400 mx-auto flex items-center justify-center mb-3">
            <User className="w-6 h-6" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-white">
            Create Customer Account
          </h1>
          <p className="text-slate-300 text-xs mt-1">
            Join GharDesign for transparent structural plannings, verified engineers & direct materials
          </p>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-3 mt-4 text-xs font-semibold">
            <span className={`px-2.5 py-1 rounded-full ${step === 'DETAILS' ? 'bg-gold-500 text-navy-950' : 'bg-navy-800 text-slate-300'}`}>
              1. Customer Details
            </span>
            <span className="text-slate-500">→</span>
            <span className={`px-2.5 py-1 rounded-full ${step === 'OTP' ? 'bg-gold-500 text-navy-950' : 'bg-navy-800 text-slate-300'}`}>
              2. Mobile OTP Verification
            </span>
          </div>
        </div>

        {/* Step 1: Registration Form */}
        {step === 'DETAILS' ? (
          <form onSubmit={handleSubmit(onDetailsSubmit)} className="p-6 sm:p-8 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                {errors.fullName && <p className="text-rose-600 text-[11px]">{errors.fullName.message}</p>}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold">+91</span>
                  <input
                    {...register('mobileNumber')}
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    maxLength={10}
                    className="w-full pl-12 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  />
                </div>
                {errors.mobileNumber && <p className="text-rose-600 text-[11px]">{errors.mobileNumber.message}</p>}
              </div>

              {/* Alternate Contact Number */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  Alternate Contact (Optional)
                </label>
                <input
                  {...register('alternateContact')}
                  type="tel"
                  placeholder="Optional 10-digit number"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                {errors.alternateContact && <p className="text-rose-600 text-[11px]">{errors.alternateContact.message}</p>}
              </div>

              {/* Email Address */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address (Optional)
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                {errors.email && <p className="text-rose-600 text-[11px]">{errors.email.message}</p>}
              </div>

              {/* House / Flat / Plot Number */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  House/Flat/Plot No. <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('housePlotNumber')}
                  type="text"
                  placeholder="Plot 42 / Villa 14B"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                {errors.housePlotNumber && <p className="text-rose-600 text-[11px]">{errors.housePlotNumber.message}</p>}
              </div>

              {/* Street / Locality */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Street / Locality <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('streetLocality')}
                  type="text"
                  placeholder="Sector 65, Golf Course Ext"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                {errors.streetLocality && <p className="text-rose-600 text-[11px]">{errors.streetLocality.message}</p>}
              </div>

              {/* City (Searchable Dropdown) */}
              <div className="space-y-1">
                <SearchableCitySelect
                  value={selectedCity || ''}
                  onChange={(cityName, stateName, pinCode) => {
                    setValue('city', cityName, { shouldValidate: true });
                    if (stateName) {
                      setValue('state', stateName, { shouldValidate: true });
                    }
                    if (pinCode) {
                      setValue('pinCode', pinCode, { shouldValidate: true });
                    }
                  }}
                  placeholder="Select City Name"
                  label="City"
                  required
                  error={errors.city?.message}
                />
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>State <span className="text-rose-500">*</span></span>
                  {watchedState && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Auto-filled
                    </span>
                  )}
                </label>
                <input
                  {...register('state')}
                  type="text"
                  placeholder="State (e.g. Rajasthan, Maharashtra)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                {errors.state && <p className="text-rose-600 text-[11px]">{errors.state.message}</p>}
              </div>

              {/* PIN Code */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>PIN Code <span className="text-rose-500">*</span></span>
                  {watchedPinCode && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Auto-filled
                    </span>
                  )}
                </label>
                <input
                  {...register('pinCode')}
                  type="text"
                  maxLength={6}
                  placeholder=""
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                {errors.pinCode && <p className="text-rose-600 text-[11px]">{errors.pinCode.message}</p>}
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('country')}
                  type="text"
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600"
                />
              </div>

              {/* Landmark */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700">Landmark (Optional)</label>
                <input
                  {...register('landmark')}
                  type="text"
                  placeholder="Near Metro Station / Opposite Community Park"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition"
              >
                <span>Proceed to Mobile OTP Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-2 text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-navy-900 font-bold hover:underline">
                Sign In with OTP
              </Link>
            </div>
          </form>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="p-6 sm:p-8 space-y-5 text-xs">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-700 mx-auto flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="font-bold text-base text-slate-900">Verify Mobile Number</h2>
              <p className="text-slate-500">
                Enter the verification code sent to{' '}
                <span className="font-bold text-slate-800">+91 {formData?.mobileNumber}</span>
              </p>
            </div>

            {/* Prominent Live Screen OTP Box */}
            <div className="p-4 bg-gradient-to-br from-amber-50 via-gold-50/80 to-amber-100/70 border-2 border-gold-400 rounded-2xl text-center space-y-1.5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Your Verification OTP</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-[0.35em] text-navy-950 py-1.5 select-all bg-white/85 rounded-xl border border-gold-300 shadow-2xs">
                {liveOtp || (formData?.mobileNumber ? sessionStorage.getItem(`live_otp_${formData.mobileNumber.replace(/\D/g, '').slice(-10)}`) : '') || '123456'}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-amber-950 font-semibold">
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md font-bold text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Auto-Fetched</span>
                </span>
                <span>Code for +91 {formData?.mobileNumber}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Enter 6-digit OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="w-full text-center text-lg tracking-widest font-mono font-bold py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                autoFocus
              />
              {otpError && <p className="text-rose-600 font-medium">{otpError}</p>}
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="text-navy-900 hover:underline font-semibold"
              >
                ← Edit Details
              </button>
              <button
                type="button"
                disabled={resendTimer > 0}
                onClick={() => {
                  const raw = (formData?.mobileNumber || '').replace(/\D/g, '').slice(-10);
                  const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
                  sessionStorage.setItem(`live_otp_${raw}`, freshOtp);
                  sessionStorage.setItem(`admin_live_otp_${raw}`, freshOtp);
                  sessionStorage.setItem('last_generated_otp', freshOtp);
                  setLiveOtp(freshOtp);
                  setOtp(freshOtp); // Auto-fetch fresh OTP
                  setOtpError('');
                  setResendTimer(30);
                }}
                className="text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? 'Verifying & Creating Account...' : 'Verify OTP & Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
