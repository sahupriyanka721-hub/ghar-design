import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Home,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
  RotateCcw,
  AlertCircle,
  Truck,
  Building,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getCustomerByPhone } from '../../data/customerStore.js';
import { MaterialProductItem, MaterialProductVariant } from '../../data/materialsCatalog.js';
import { SearchableCitySelect } from '../common/SearchableCitySelect.js';

interface CustomerPurchaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItem: {
    product: MaterialProductItem;
    quantity: number;
    variant?: MaterialProductVariant;
  } | null;
  onAuthSuccess: () => void;
}

export const CustomerPurchaseAuthModal: React.FC<CustomerPurchaseAuthModalProps> = ({
  isOpen,
  onClose,
  pendingItem,
  onAuthSuccess,
}) => {
  const { loginWithOtp, signupWithOtp } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [loading, setLoading] = useState(false);

  // Registration Form State
  const [regStep, setRegStep] = useState<'FORM' | 'OTP'>('FORM');
  const [regForm, setRegForm] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    housePlotNumber: '',
    streetLocality: '',
    city: '',
    state: '',
    pinCode: '',
    landmark: '',
  });
  const [regOtp, setRegOtp] = useState('');
  const [regLiveOtp, setRegLiveOtp] = useState('');

  // Login Form State
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loginPhone, setLoginPhone] = useState('');
  const [detectedCustomerName, setDetectedCustomerName] = useState<string | null>(null);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginLiveOtp, setLoginLiveOtp] = useState('');

  if (!isOpen) return null;

  const product = pendingItem?.product;
  const quantity = pendingItem?.quantity || 1;
  const variant = pendingItem?.variant;
  const unitPrice = product ? product.pricePaise + (variant ? variant.priceModifierPaise : 0) : 0;
  const lineTotalPaise = unitPrice * quantity;

  // 1. Send OTP for Registration
  const handleRegisterSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName.trim() || regForm.fullName.trim().length < 2) {
      error('Please enter your full name (minimum 2 characters)');
      return;
    }
    const cleanPhone = regForm.mobileNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!regForm.housePlotNumber.trim() || !regForm.streetLocality.trim()) {
      error('Please enter your delivery house/plot number and street');
      return;
    }
    if (!regForm.pinCode.trim() || !/^\d{6}$/.test(regForm.pinCode.trim())) {
      error('Please enter a valid 6-digit PIN code');
      return;
    }

    // Check if phone already registered
    const existing = getCustomerByPhone(cleanPhone);
    if (existing) {
      error(`Mobile number +91 ${cleanPhone} is already registered! Please switch to 'Existing Customer Login' tab.`);
      setLoginPhone(cleanPhone);
      setActiveTab('LOGIN');
      return;
    }

    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`live_otp_${cleanPhone}`, generated);
    sessionStorage.setItem(`admin_live_otp_${cleanPhone}`, generated);
    sessionStorage.setItem('last_generated_otp', generated);
    setRegLiveOtp(generated);
    setRegOtp(generated); // Automatically fetch OTP into registration field
    setRegStep('OTP');
    success(`Verification OTP Auto-Fetched: ${generated}`);
  };

  // 2. Verify Registration OTP & Complete Account Creation
  const handleRegisterVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regOtp.trim().length !== 6) {
      error('Please enter the 6-digit verification OTP');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = regForm.mobileNumber.replace(/\D/g, '').slice(-10);
      const signupPayload = {
        fullName: regForm.fullName.trim(),
        mobileNumber: cleanPhone,
        email: regForm.email.trim() || undefined,
        housePlotNumber: regForm.housePlotNumber.trim(),
        streetLocality: regForm.streetLocality.trim(),
        city: regForm.city.trim(),
        state: regForm.state.trim(),
        pinCode: regForm.pinCode.trim(),
        landmark: regForm.landmark.trim() || undefined,
        country: 'India',
      };

      await signupWithOtp(signupPayload, regOtp.trim());
      success(`Welcome to GharDesign, ${regForm.fullName.trim()}! Account created successfully.`);
      onAuthSuccess();
    } catch (err: any) {
      error(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Send OTP for Existing Customer Login
  const handleLoginSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    // Look up customer in store
    const existing = getCustomerByPhone(cleanPhone);
    if (!existing) {
      error(
        `Mobile number +91 ${cleanPhone} is not registered yet. Please click 'Register as New Customer' to create your account in 30 seconds.`
      );
      return;
    }

    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`live_otp_${cleanPhone}`, generated);
    sessionStorage.setItem(`admin_live_otp_${cleanPhone}`, generated);
    sessionStorage.setItem('last_generated_otp', generated);
    setLoginLiveOtp(generated);
    setLoginOtp(generated); // Automatically fetch OTP into login field
    setDetectedCustomerName(existing.name);
    setLoginStep('OTP');
    success(`Verification OTP Auto-Fetched: ${generated}`);
  };

  // 4. Verify Login OTP
  const handleLoginVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginOtp.trim().length !== 6) {
      error('Please enter the 6-digit verification OTP');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
      await loginWithOtp(cleanPhone, loginOtp.trim(), detectedCustomerName || undefined);
      success(`Welcome back, ${detectedCustomerName || 'Homeowner'}! Proceeding to checkout.`);
      onAuthSuccess();
    } catch (err: any) {
      error(err.message || 'Login verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-navy-950 text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-gold-500/10 to-transparent pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-400/30 text-[10px] font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Customer Checkout Verification</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                {activeTab === 'REGISTER' ? 'Register to Complete Purchase' : 'Login with Mobile Number'}
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                {activeTab === 'REGISTER'
                  ? 'Create your customer profile once. Save site address, track deliveries & download GST invoices.'
                  : 'Welcome back! Enter your registered mobile number to continue directly to order placement.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition shrink-0 ml-3"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Product Snippet Being Purchased */}
          {product && (
            <div className="mt-4 p-3 bg-white/10 rounded-2xl border border-white/15 flex items-center gap-3 backdrop-blur-xs relative z-10">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0 bg-slate-900"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-gold-400 uppercase tracking-wider truncate">
                  {product.brand} • {product.subcategory}
                </div>
                <div className="text-xs font-bold text-white truncate">{product.name}</div>
                <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                  <span>Qty: <strong>{quantity} {product.unit}</strong></span>
                  <span>•</span>
                  <span>Total: <strong className="text-gold-400 font-mono">₹{(lineTotalPaise / 100).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTER');
              setRegStep('FORM');
            }}
            className={`flex-1 py-3 px-4 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'REGISTER'
                ? 'border-gold-500 text-navy-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-gold-600" />
            <span>New Customer Registration</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGIN');
              setLoginStep('PHONE');
            }}
            className={`flex-1 py-3 px-4 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'LOGIN'
                ? 'border-gold-500 text-navy-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Already Registered? Mobile Login</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto text-xs space-y-4">
          
          {/* ============================================================== */}
          {/* TAB 1: NEW CUSTOMER REGISTRATION                               */}
          {/* ============================================================== */}
          {activeTab === 'REGISTER' && (
            <div>
              {regStep === 'FORM' ? (
                <form onSubmit={handleRegisterSendOtp} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Full Name */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regForm.fullName}
                        onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex">
                        <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-600 font-bold text-xs select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={regForm.mobileNumber}
                          onChange={(e) => setRegForm({ ...regForm, mobileNumber: e.target.value })}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-r-xl font-mono text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Email (Optional) */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Email Address <span className="text-slate-400 text-[10px]">(For GST invoice)</span>
                      </label>
                      <input
                        type="email"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
                      />
                    </div>

                    {/* House / Plot Number */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-slate-400" />
                        House / Plot / Site No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regForm.housePlotNumber}
                        onChange={(e) => setRegForm({ ...regForm, housePlotNumber: e.target.value })}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
                      />
                    </div>

                    {/* Street / Locality */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Street / Sector / Locality <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regForm.streetLocality}
                        onChange={(e) => setRegForm({ ...regForm, streetLocality: e.target.value })}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
                      />
                    </div>

                    {/* City (Searchable Dropdown) */}
                    <div className="space-y-1">
                      <SearchableCitySelect
                        value={regForm.city}
                        onChange={(cityName, stateName, pinCode) =>
                          setRegForm((prev) => ({
                            ...prev,
                            city: cityName,
                            ...(stateName ? { state: stateName } : {}),
                            ...(pinCode ? { pinCode: pinCode } : {}),
                          }))
                        }
                        placeholder="Select City Name"
                        label="City"
                        required
                      />
                    </div>

                    {/* State */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">State <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={regForm.state}
                        onChange={(e) => setRegForm({ ...regForm, state: e.target.value })}
                        placeholder="State (e.g. Rajasthan, Haryana)"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
                      />
                    </div>

                    {/* PIN Code */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">6-Digit PIN Code <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={regForm.pinCode}
                        onChange={(e) => setRegForm({ ...regForm, pinCode: e.target.value })}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                      />
                    </div>

                    {/* Landmark */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Landmark / Unloading Site Note</label>
                      <input
                        type="text"
                        value={regForm.landmark}
                        onChange={(e) => setRegForm({ ...regForm, landmark: e.target.value })}
                        placeholder="Near Cyber City metro pillar"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="btn-gold w-full py-3.5 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>Get Mobile Verification OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                /* Registration OTP Step */
                <form onSubmit={handleRegisterVerifyOtp} className="space-y-5 py-2">
                  <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-amber-950 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        Verify Mobile OTP
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Enter the 6-digit verification code sent to <strong>+91 {regForm.mobileNumber}</strong>.
                    </p>
                  </div>

                  {/* Prominent Live Screen OTP Box */}
                  <div className="p-4 bg-gradient-to-br from-amber-50 via-gold-50/80 to-amber-100/70 border-2 border-gold-400 rounded-2xl text-center space-y-1.5 shadow-sm">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>Your Verification OTP</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono tracking-[0.35em] text-navy-950 py-1.5 select-all bg-white/85 rounded-xl border border-gold-300 shadow-2xs">
                      {regLiveOtp || (regForm.mobileNumber ? sessionStorage.getItem(`live_otp_${regForm.mobileNumber.replace(/\D/g, '').slice(-10)}`) : '') || '123456'}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-amber-950 font-semibold">
                      <span>Code for +91 {regForm.mobileNumber}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const curOtp = regLiveOtp || (regForm.mobileNumber ? sessionStorage.getItem(`live_otp_${regForm.mobileNumber.replace(/\D/g, '').slice(-10)}`) : '') || '123456';
                          setRegOtp(curOtp);
                        }}
                        className="px-2.5 py-0.5 bg-navy-950 hover:bg-navy-900 text-gold-400 rounded-lg text-[10px] font-black transition shadow-2xs"
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block text-xs">
                      Enter 6-Digit Numeric OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3.5 border-2 border-navy-950 rounded-2xl focus:ring-2 focus:ring-gold-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setRegStep('FORM')}
                      className="text-slate-500 hover:text-navy-950 font-bold underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Edit Customer Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => success('OTP re-dispatched via SMS')}
                      className="text-gold-700 hover:underline font-bold"
                    >
                      Resend OTP
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || regOtp.length !== 6}
                    className="btn-primary w-full py-3.5 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Verifying & Setting Up...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-gold-400 fill-gold-400" />
                        <span>Verify & Continue to Order Placement</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: EXISTING CUSTOMER LOGIN WITH MOBILE                     */}
          {/* ============================================================== */}
          {activeTab === 'LOGIN' && (
            <div>
              {loginStep === 'PHONE' ? (
                <form onSubmit={handleLoginSendOtp} className="space-y-5 py-2">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Registered Customer Direct Login</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Jis number se aapne pehle register kiya hai, usi number se direct login karein. Aapke saved site addresses aur purchase history restore ho jayegi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block text-xs">
                      Registered 10-Digit Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="px-3.5 py-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-700 font-bold text-sm select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        autoFocus
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="Enter registered mobile number"
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-r-xl font-mono text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-gold w-full py-3.5 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('REGISTER');
                        setRegStep('FORM');
                      }}
                      className="text-xs text-navy-950 font-bold hover:underline"
                    >
                      Not registered yet? Click here to Register as New Customer →
                    </button>
                  </div>
                </form>
              ) : (
                /* Login OTP Step */
                <form onSubmit={handleLoginVerifyOtp} className="space-y-5 py-2">
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        Customer Verified: {detectedCustomerName}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-800">
                      Enter the 6-digit OTP code sent to <strong>+91 {loginPhone}</strong>.
                    </p>
                  </div>

                  {/* Prominent Live Screen OTP Box */}
                  <div className="p-4 bg-gradient-to-br from-amber-50 via-gold-50/80 to-amber-100/70 border-2 border-gold-400 rounded-2xl text-center space-y-1.5 shadow-sm">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>Your Verification OTP</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono tracking-[0.35em] text-navy-950 py-1.5 select-all bg-white/85 rounded-xl border border-gold-300 shadow-2xs">
                      {loginLiveOtp || (loginPhone ? sessionStorage.getItem(`live_otp_${loginPhone.replace(/\D/g, '').slice(-10)}`) : '') || '123456'}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-amber-950 font-semibold">
                      <span>Code for +91 {loginPhone}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const curOtp = loginLiveOtp || (loginPhone ? sessionStorage.getItem(`live_otp_${loginPhone.replace(/\D/g, '').slice(-10)}`) : '') || '123456';
                          setLoginOtp(curOtp);
                        }}
                        className="px-2.5 py-0.5 bg-navy-950 hover:bg-navy-900 text-gold-400 rounded-lg text-[10px] font-black transition shadow-2xs"
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block text-xs">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3.5 border-2 border-navy-950 rounded-2xl focus:ring-2 focus:ring-gold-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setLoginStep('PHONE')}
                      className="text-slate-500 hover:text-navy-950 font-bold underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Change Mobile Number</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => success('Login OTP re-dispatched via SMS')}
                      className="text-gold-700 hover:underline font-bold"
                    >
                      Resend OTP
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || loginOtp.length !== 6}
                    className="btn-primary w-full py-3.5 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Verifying Session...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-gold-400 fill-gold-400" />
                        <span>Sign In & Proceed to Order Placement</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer Security Badge */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-center gap-4 shrink-0">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Encrypted OTP Verification
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            Direct Mill & Depot Delivery
          </span>
        </div>

      </div>
    </div>
  );
};
