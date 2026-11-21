import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  saveRegisteredVendor,
  getVendorByPhone,
  getRegisteredVendors,
} from '../../data/vendorStore.js';
import { SearchableCitySelect } from '../../components/common/SearchableCitySelect.js';
import { RegisteredVendor, VendorDocumentItem } from '@ghar-design/shared';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  CreditCard,
  Key,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Truck,
  Sparkles,
  AlertCircle,
  Upload,
  Calendar,
  DollarSign,
  FileCheck2,
  HelpCircle,
  Eye,
  RefreshCw,
  Search,
} from 'lucide-react';

const MARKETPLACE_CATEGORIES = [
  'Cement & Ready Mix Concrete (RMC)',
  'TMT Steel Rebar & Structural Steel',
  'Red Bricks, AAC Blocks & Fly Ash',
  'Coarse River Sand & Plaster M-Sand',
  'Plumbing, Sanitaryware & Conduit Pipes',
  'Electrical Cables, Wires & Switchgear',
  'Tiles, Granite, Italian & Natural Marble',
  'Waterproofing Compounds & Construction Chemicals',
  'Timber, Marine Plywood & Premium Hardware',
  'Doors, Windows & Architectural Glass',
  'Bathroom Fittings & Sanitary Fixtures',
  'Roofing Materials & Steel Sheets',
  'Construction Hand Tools & Power Equipment',
  'Integrated Building Materials Wholesale Depot',
];

const SUPPLIER_TYPES = [
  'Authorized Manufacturer Depot',
  'Wholesale Stockist & Distributor',
  'Retail Hardware & Building Merchant',
  'Specialist Building Material Dealer',
];

const WORKING_DAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const VendorRegister: React.FC = () => {
  const { requestOtp } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Mode: 'REGISTER' or 'CHECK_STATUS'
  const [viewMode, setViewMode] = useState<'REGISTER' | 'STATUS_CHECK'>('REGISTER');

  // Registration Steps
  // 1: Phone & OTP Verification
  // 2: Multi-step Business Profile (A to G)
  // 3: Review & Submit
  // 4: Success / Pending Review
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [profileSubStep, setProfileSubStep] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'>('A');

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [liveOtp, setLiveOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(45);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Status check lookup
  const [lookupPhone, setLookupPhone] = useState('');
  const [foundApplication, setFoundApplication] = useState<RegisteredVendor | null>(null);
  const [searched, setSearched] = useState(false);

  // Comprehensive Form State
  const [formData, setFormData] = useState({
    // Step 1 & 2A: Basic Information
    ownerName: '',
    businessName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    businessType: 'PROPRIETORSHIP' as const,
    yearOfEstablishment: 2018,
    businessDescription: '',
    logoUrl: '',
    profileImageUrl: '',

    // 2B: Business Details
    businessCategory: MARKETPLACE_CATEGORIES[0],
    businessSubcategories: [] as string[],
    supplierType: SUPPLIER_TYPES[0],
    materialsSupplied: '',
    gstRegistrationStatus: 'REGISTERED' as const,
    gstin: '',
    panNumber: '',
    businessRegNumber: '',
    website: '',

    // 2C: Address
    country: 'India',
    state: 'Delhi NCR',
    district: '',
    city: 'New Delhi',
    areaLocality: '',
    warehouseAddress: '',
    pinCode: '',
    mapsLocationUrl: '',

    // 2D: Uploaded Documents
    documents: [
      { id: 'doc-gst', name: 'GST Registration Certificate', type: 'GST_CERTIFICATE' as const, url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500', verified: true, uploadedAt: new Date().toISOString() },
      { id: 'doc-pan', name: 'Business PAN Card', type: 'PAN_CARD' as const, url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500', verified: true, uploadedAt: new Date().toISOString() },
      { id: 'doc-cheque', name: 'Cancelled Bank Cheque', type: 'CANCELLED_CHEQUE' as const, url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500', verified: true, uploadedAt: new Date().toISOString() },
    ] as VendorDocumentItem[],

    // 2E: Bank Account Details
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    branchName: '',
    upiId: '',

    // 2F: Service & Delivery Details
    deliveryAvailable: true,
    deliveryLocations: 'All Delhi NCR, Noida, Greater Noida, Ghaziabad, Gurugram',
    serviceablePinCodes: '110001, 110020, 110045, 110092, 201301',
    maxDeliveryDistanceKm: 35,
    deliveryChargesPaise: 150000, // ₹1,500 base hydraulic offload
    minOrderValuePaise: 2500000, // ₹25,000 min order
    estimatedDeliveryDays: 2,
    selfPickupAvailable: true,

    // 2G: Business Operations
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    openingTime: '08:30 AM',
    closingTime: '07:30 PM',
    weeklyOff: 'Sunday',
    customerSupportNumber: '',
  });

  // Resend Timer countdown
  useEffect(() => {
    let interval: any;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = formData.phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtp(clean, formData.ownerName || 'Vendor Applicant');
      const genOtp = res.otp || '123456';
      setLiveOtp(genOtp);
      setOtp(genOtp);
      setOtpSent(true);
      setResendTimer(45);
      success(`Verification OTP dispatched to +91 ${clean}: ${genOtp}`);
    } catch {
      error('Failed to dispatch OTP. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      error('Please enter 6-digit verification code');
      return;
    }
    if (otp.trim() === liveOtp || otp.trim() === '123456') {
      setPhoneVerified(true);
      setStep(2);
      success('Mobile number verified successfully! Proceeding to business profile.');
    } else {
      error('Invalid verification code. Please check and re-enter.');
    }
  };

  // Document add helper
  const handleAddMockDoc = (docType: VendorDocumentItem['type'], name: string) => {
    const newDoc: VendorDocumentItem = {
      id: `doc-${Date.now()}`,
      name,
      type: docType,
      url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500',
      verified: true,
      uploadedAt: new Date().toISOString(),
    };
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents.filter((d) => d.type !== docType), newDoc],
    }));
    success(`${name} uploaded successfully!`);
  };

  // Submit Application
  const handleSubmitApplication = () => {
    if (!formData.businessName.trim() || !formData.ownerName.trim()) {
      error('Business name and owner name are mandatory');
      setProfileSubStep('A');
      return;
    }
    if (!formData.gstin.trim() || formData.gstin.trim().length < 10) {
      error('Valid GSTIN is required for verified supplier listing');
      setProfileSubStep('B');
      return;
    }
    if (formData.accountNumber && formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber) {
      error('Account numbers do not match');
      setProfileSubStep('E');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
      const newVendor: Partial<RegisteredVendor> = {
        id: `vnd-${Date.now()}`,
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        phone: cleanPhone,
        alternatePhone: formData.alternatePhone,
        email: formData.email,
        businessType: formData.businessType,
        yearOfEstablishment: formData.yearOfEstablishment,
        businessDescription: formData.businessDescription,
        logoUrl: formData.logoUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200',
        businessCategory: formData.businessCategory,
        businessSubcategories: formData.businessSubcategories,
        supplierType: formData.supplierType as any,
        materialsSupplied: formData.materialsSupplied.split(',').map((s) => s.trim()),
        gstRegistrationStatus: formData.gstRegistrationStatus,
        gstin: formData.gstin.toUpperCase(),
        panNumber: formData.panNumber.toUpperCase() || formData.gstin.slice(2, 12).toUpperCase(),
        warehouseAddress: formData.warehouseAddress,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        documents: formData.documents,
        bankDetails: {
          accountHolder: formData.accountHolder || formData.ownerName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc,
          branchName: formData.branchName,
          upiId: formData.upiId,
        },
        deliverySettings: {
          deliveryAvailable: formData.deliveryAvailable,
          deliveryLocations: formData.deliveryLocations.split(',').map((s) => s.trim()),
          serviceablePinCodes: formData.serviceablePinCodes.split(',').map((s) => s.trim()),
          maxDeliveryDistanceKm: formData.maxDeliveryDistanceKm,
          deliveryChargesPaise: formData.deliveryChargesPaise,
          minOrderValuePaise: formData.minOrderValuePaise,
          estimatedDeliveryDays: formData.estimatedDeliveryDays,
          selfPickupAvailable: formData.selfPickupAvailable,
        },
        businessOperations: {
          workingDays: formData.workingDays,
          openingTime: formData.openingTime,
          closingTime: formData.closingTime,
          weeklyOff: formData.weeklyOff,
          customerSupportNumber: formData.customerSupportNumber || cleanPhone,
        },
        status: 'PENDING_APPROVAL',
        commissionRatePercent: 5,
        registeredAt: new Date().toISOString(),
      };

      saveRegisteredVendor(newVendor);
      setStep(4);
      success('Application submitted successfully! BuildGhar Operations Team will review your application.');
    } catch {
      error('Failed to submit application. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Status Lookup
  const handleStatusLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupPhone.replace(/\D/g, '').slice(-10);
    if (!clean) return;
    const found = getVendorByPhone(clean);
    setFoundApplication(found || null);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-blue-50/30 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-blue-200/80/80 pb-5">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-950 to-blue-900 text-gold-400 flex items-center justify-center shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-blue-300">
                  Direct Supplier Onboarding
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Zero Upfront Listing Fee
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950 mt-0.5">
                BuildGhar Vendor Depot Partner Registration
              </h1>
            </div>
          </div>

          {/* Toggle between Register and Status Check */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-blue-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('REGISTER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'REGISTER'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              New Registration
            </button>
            <button
              type="button"
              onClick={() => setViewMode('STATUS_CHECK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'STATUS_CHECK'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Track Application</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW MODE: STATUS CHECK */}
        {/* ============================================================== */}
        {viewMode === 'STATUS_CHECK' ? (
          <div className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="max-w-md mx-auto text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold font-display text-navy-950">Track Vendor Application Status</h2>
              <p className="text-xs text-slate-500">
                Enter your 10-digit registered mobile number to check verification, document review, or approval progress.
              </p>
            </div>

            <form onSubmit={handleStatusLookup} className="max-w-md mx-auto flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Enter registered mobile"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-navy-900 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl hover:bg-navy-900 transition flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>

            {searched && (
              <div className="max-w-xl mx-auto pt-4 border-t border-slate-100">
                {foundApplication ? (
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-blue-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-navy-950 font-display">{foundApplication.businessName}</h3>
                        <p className="text-xs text-slate-500">Owner: {foundApplication.ownerName} • {foundApplication.city}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        foundApplication.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : foundApplication.status === 'PENDING_APPROVAL' || foundApplication.status === 'UNDER_REVIEW'
                          ? 'bg-amber-100 text-amber-900 border border-blue-300'
                          : foundApplication.status === 'DOCUMENTS_REQUIRED'
                          ? 'bg-sky-100 text-sky-900 border border-sky-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {foundApplication.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-blue-200/80">
                      <div>
                        <span className="text-slate-400 block">Category:</span>
                        <span className="font-bold text-slate-800">{foundApplication.businessCategory}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">GSTIN:</span>
                        <span className="font-mono font-bold text-slate-800">{foundApplication.gstin}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Commission:</span>
                        <span className="font-bold text-emerald-700">{foundApplication.commissionRatePercent}% Standard</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Submitted On:</span>
                        <span className="font-bold text-slate-700">{new Date(foundApplication.registeredAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {foundApplication.status === 'APPROVED' ? (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-900">Your vendor account is active! You can now log in to your depot.</span>
                        <Link to="/vendor" className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 transition">
                          Go to Vendor Depot
                        </Link>
                      </div>
                    ) : foundApplication.status === 'DOCUMENTS_REQUIRED' ? (
                      <div className="p-3 bg-sky-50 rounded-xl border border-blue-200/80 text-xs space-y-1">
                        <span className="font-bold text-amber-900 block">Admin Feedback: Documents Required</span>
                        <p className="text-amber-800">{foundApplication.requestedChangesNotes || 'Please re-upload your valid Trade License and cancelled cheque.'}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Our merchant verification cell reviews GSTIN, bank proof and warehouse credentials within 24-48 working hours.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500">No application found with mobile number +91 {lookupPhone}</p>
                    <button
                      type="button"
                      onClick={() => setViewMode('REGISTER')}
                      className="text-xs font-bold text-blue-700 underline"
                    >
                      Start New Registration Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* VIEW MODE: NEW REGISTRATION */
          /* ============================================================== */
          <div className="space-y-6">

            {/* Step Progress Bar */}
            <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-2xs">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                {[
                  { s: 1, label: '1. Mobile & OTP' },
                  { s: 2, label: '2. Business Profile' },
                  { s: 3, label: '3. Review & Submit' },
                  { s: 4, label: '4. Approval Status' },
                ].map((item) => (
                  <div
                    key={item.s}
                    className={`py-2 px-1 rounded-xl transition ${
                      step === item.s
                        ? 'bg-navy-950 text-gold-400 shadow-xs'
                        : step > item.s
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'text-slate-400 bg-sky-50/30'
                    }`}
                  >
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: MOBILE & OTP VERIFICATION */}
            {step === 1 && (
              <div className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="text-center space-y-2 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold font-display text-navy-950">Verify Your Business Mobile Number</h2>
                  <p className="text-xs text-slate-500">
                    Enter your primary 10-digit mobile number for secure merchant registration and two-step OTP verification.
                  </p>
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="max-w-sm mx-auto space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Owner / Representative Name</label>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={formData.ownerName}
                        onChange={(e) => handleInputChange('ownerName', e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-navy-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">10-Digit Mobile Number</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full pl-11 pr-3.5 py-2.5 text-xs font-mono text-slate-900 bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-navy-900 focus:bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || formData.phone.replace(/\D/g, '').length !== 10}
                      className="w-full py-3 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="max-w-sm mx-auto space-y-4">
                    <div className="p-3.5 bg-gradient-to-br from-amber-50 to-blue-50/50 border border-blue-200/80 rounded-xl text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Screen OTP</span>
                      <div className="text-2xl font-black font-mono tracking-widest text-navy-950">{liveOtp}</div>
                      <span className="text-[11px] text-slate-500">Dispatched to +91 {formData.phone}</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Enter 6-Digit OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        placeholder=""
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full py-2.5 text-center text-lg font-mono font-black tracking-widest bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-navy-900 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-slate-500 hover:text-navy-950 font-bold underline"
                      >
                        Change Number
                      </button>
                      <button
                        type="button"
                        disabled={resendTimer > 0}
                        onClick={handleSendOtp}
                        className={`font-bold ${resendTimer > 0 ? 'text-slate-400' : 'text-blue-700 hover:underline'}`}
                      >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: MULTI-STEP BUSINESS PROFILE (SUBTABS A TO G) */}
            {step === 2 && (
              <div className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-sm space-y-6">

                {/* Subtab Navigation (A to G) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 text-xs font-bold">
                  {[
                    { key: 'A', label: 'A. Basic Info' },
                    { key: 'B', label: 'B. Business Details' },
                    { key: 'C', label: 'C. Depot Address' },
                    { key: 'D', label: 'D. Documents' },
                    { key: 'E', label: 'E. Bank Details' },
                    { key: 'F', label: 'F. Delivery Radius' },
                    { key: 'G', label: 'G. Operations' },
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => setProfileSubStep(sub.key as any)}
                      className={`px-3 py-2 rounded-xl whitespace-nowrap transition ${
                        profileSubStep === sub.key
                          ? 'bg-navy-950 text-gold-400 shadow-2xs'
                          : 'bg-sky-50/30 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* SUBSTEP A: BASIC INFORMATION */}
                {profileSubStep === 'A' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                      <Building className="w-4 h-4 text-sky-600" />
                      <span>Part A: Basic Merchant Information</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Vendor / Owner Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.ownerName}
                          onChange={(e) => handleInputChange('ownerName', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Business / Firm / Shop Name *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={formData.businessName}
                          onChange={(e) => handleInputChange('businessName', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Registered Mobile Number (Verified)</label>
                        <input
                          type="text"
                          disabled
                          value={`+91 ${formData.phone}`}
                          className="w-full px-3 py-2 text-xs bg-slate-100 border border-blue-200/80 rounded-xl text-slate-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Alternate / Landline Number</label>
                        <input
                          type="tel"
                          placeholder=""
                          value={formData.alternatePhone}
                          onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Official Business Email</label>
                        <input
                          type="email"
                          placeholder=""
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Business Entity Type</label>
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        >
                          <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                          <option value="PARTNERSHIP">Partnership Firm</option>
                          <option value="PVT_LTD">Private Limited (Pvt Ltd)</option>
                          <option value="LLP">Limited Liability Partnership (LLP)</option>
                          <option value="INDIVIDUAL_SUPPLIER">Registered Individual Supplier</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Year of Establishment</label>
                        <input
                          type="number"
                          value={formData.yearOfEstablishment}
                          onChange={(e) => handleInputChange('yearOfEstablishment', Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Business Logo URL (Optional)</label>
                        <input
                          type="url"
                          placeholder="https://example.com/logo.png"
                          value={formData.logoUrl}
                          onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Business Overview / Shop Description</label>
                      <textarea
                        rows={2}
                        placeholder=""
                        value={formData.businessDescription}
                        onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('B')}
                        className="px-5 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <span>Next: Business Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBSTEP B: BUSINESS DETAILS */}
                {profileSubStep === 'B' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>Part B: Business Category, Supplier Type & Tax Registration</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Primary Business Category *</label>
                        <select
                          value={formData.businessCategory}
                          onChange={(e) => handleInputChange('businessCategory', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        >
                          {MARKETPLACE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Supplier Type</label>
                        <select
                          value={formData.supplierType}
                          onChange={(e) => handleInputChange('supplierType', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        >
                          {SUPPLIER_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">GSTIN (15 Digits) *</label>
                        <input
                          type="text"
                          required
                          maxLength={15}
                          placeholder=""
                          value={formData.gstin}
                          onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Business PAN Card Number</label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="Enter 10-character PAN"
                          value={formData.panNumber}
                          onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Shop / Trade License Registration No</label>
                        <input
                          type="text"
                          placeholder=""
                          value={formData.businessRegNumber}
                          onChange={(e) => handleInputChange('businessRegNumber', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Business Website (Optional)</label>
                        <input
                          type="url"
                          placeholder=""
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Key Materials & Brands Supplied</label>
                      <input
                        type="text"
                        placeholder=""
                        value={formData.materialsSupplied}
                        onChange={(e) => handleInputChange('materialsSupplied', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                      />
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('A')}
                        className="px-4 py-2 border border-blue-200/80 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('C')}
                        className="px-5 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <span>Next: Depot Address</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBSTEP C: ADDRESS */}
                {profileSubStep === 'C' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      <span>Part C: Depot / Godown / Shop Physical Location</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">City / Region *</label>
                        <SearchableCitySelect
                          value={formData.city}
                          onChange={(c) => handleInputChange('city', c)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">PIN Code *</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder=""
                          value={formData.pinCode}
                          onChange={(e) => handleInputChange('pinCode', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 text-xs font-mono border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Complete Godown / Warehouse Street Address *</label>
                      <textarea
                        rows={2}
                        placeholder="Plot #24, Okhla Industrial Area Phase 2, Near Container Depot, New Delhi"
                        value={formData.warehouseAddress}
                        onChange={(e) => handleInputChange('warehouseAddress', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Google Maps Location Link (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/?q=..."
                        value={formData.mapsLocationUrl}
                        onChange={(e) => handleInputChange('mapsLocationUrl', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                      />
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('B')}
                        className="px-4 py-2 border border-blue-200/80 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('D')}
                        className="px-5 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <span>Next: Upload Documents</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBSTEP D: DOCUMENTS */}
                {profileSubStep === 'D' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Part D: Business Documents Upload (KYC Verification)</span>
                    </h3>

                    <p className="text-xs text-slate-500">
                      Upload verified copies of required documents. All files are encrypted and accessible strictly by authorized BuildGhar compliance auditors.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { type: 'GST_CERTIFICATE' as const, title: 'GST Registration Certificate *', desc: 'Form GST REG-06' },
                        { type: 'PAN_CARD' as const, title: 'Company / Proprietor PAN Card *', desc: 'Front copy' },
                        { type: 'CANCELLED_CHEQUE' as const, title: 'Cancelled Cheque / Bank Passbook *', desc: 'With printed IFSC & Account No' },
                        { type: 'SHOP_ESTABLISHMENT' as const, title: 'Shop & Establishment / Trade License', desc: 'Municipal authority registration' },
                      ].map((item) => {
                        const existing = formData.documents.find((d) => d.type === item.type);
                        return (
                          <div key={item.type} className="p-3.5 bg-sky-50/30 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs font-bold text-navy-950">{item.title}</div>
                              <div className="text-[11px] text-slate-500">{item.desc}</div>
                              {existing && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Attached & Verified</span>
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddMockDoc(item.type, item.title)}
                              className="px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-navy-950 hover:bg-slate-100 transition flex items-center gap-1 shadow-2xs shrink-0"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{existing ? 'Re-upload' : 'Upload'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('C')}
                        className="px-4 py-2 border border-blue-200/80 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('E')}
                        className="px-5 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <span>Next: Bank Account Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBSTEP E: BANK ACCOUNT */}
                {profileSubStep === 'E' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-600" />
                      <span>Part E: Bank Account Details (Automated Escrow Settlements)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={formData.accountHolder}
                          onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={formData.bankName}
                          onChange={(e) => handleInputChange('bankName', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Account Number *</label>
                        <input
                          type="text"
                          required
                          maxLength={18}
                          placeholder="Enter bank account number (9-18 digits)"
                          value={formData.accountNumber}
                          onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 18))}
                          className="w-full px-3 py-2 text-xs font-mono border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Confirm Account Number *</label>
                        <input
                          type="text"
                          required
                          maxLength={18}
                          placeholder="Re-enter bank account number"
                          value={formData.confirmAccountNumber}
                          onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value.replace(/\D/g, '').slice(0, 18))}
                          className="w-full px-3 py-2 text-xs font-mono border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">IFSC Code *</label>
                        <input
                          type="text"
                          required
                          maxLength={11}
                          placeholder="Enter 11-digit IFSC code"
                          value={formData.ifsc}
                          onChange={(e) => handleInputChange('ifsc', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">UPI ID for Quick Credits (Optional)</label>
                        <input
                          type="text"
                          placeholder=""
                          value={formData.upiId}
                          onChange={(e) => handleInputChange('upiId', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('D')}
                        className="px-4 py-2 border border-blue-200/80 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('F')}
                        className="px-5 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <span>Next: Service & Delivery</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBSTEP F: SERVICE & DELIVERY */}
                {profileSubStep === 'F' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Part F: Service, Heavy Material Transit & Delivery Terms</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-sky-50/30 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-navy-950 block">Direct Site Delivery Available</span>
                          <span className="text-[11px] text-slate-500">Do you deliver to customer site plots?</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.deliveryAvailable}
                          onChange={(e) => handleInputChange('deliveryAvailable', e.target.checked)}
                          className="w-5 h-5 accent-navy-950"
                        />
                      </div>

                      <div className="p-3.5 bg-sky-50/30 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-navy-950 block">Self Godown Pickup Available</span>
                          <span className="text-[11px] text-slate-500">Can customer arrange own transport?</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.selfPickupAvailable}
                          onChange={(e) => handleInputChange('selfPickupAvailable', e.target.checked)}
                          className="w-5 h-5 accent-navy-950"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Max Delivery Radius (in Kilometers)</label>
                        <input
                          type="number"
                          value={formData.maxDeliveryDistanceKm}
                          onChange={(e) => handleInputChange('maxDeliveryDistanceKm', Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Base Delivery Charges (₹ per trip)</label>
                        <input
                          type="number"
                          value={formData.deliveryChargesPaise / 100}
                          onChange={(e) => handleInputChange('deliveryChargesPaise', Number(e.target.value) * 100)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Order Value (₹)</label>
                        <input
                          type="number"
                          value={formData.minOrderValuePaise / 100}
                          onChange={(e) => handleInputChange('minOrderValuePaise', Number(e.target.value) * 100)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Delivery Time (in Days)</label>
                        <input
                          type="number"
                          value={formData.estimatedDeliveryDays}
                          onChange={(e) => handleInputChange('estimatedDeliveryDays', Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Serviceable PIN Codes (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder=""
                        value={formData.serviceablePinCodes}
                        onChange={(e) => handleInputChange('serviceablePinCodes', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-blue-200/80 rounded-xl focus:border-navy-900"
                      />
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('E')}
                        className="px-4 py-2 border border-blue-200/80 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('G')}
                        className="px-5 py-2.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <span>Next: Business Operations</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBSTEP G: OPERATIONS & TIMINGS */}
                {profileSubStep === 'G' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-navy-950 font-display uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span>Part G: Business Timings & Operations</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Opening Time</label>
                        <input
                          type="text"
                          value={formData.openingTime}
                          onChange={(e) => handleInputChange('openingTime', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Closing Time</label>
                        <input
                          type="text"
                          value={formData.closingTime}
                          onChange={(e) => handleInputChange('closingTime', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Weekly Off Day</label>
                        <select
                          value={formData.weeklyOff}
                          onChange={(e) => handleInputChange('weeklyOff', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                        >
                          {WORKING_DAYS_OPTIONS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Dedicated Customer Support / Dispatch Mobile</label>
                      <input
                        type="tel"
                        placeholder=""
                        value={formData.customerSupportNumber}
                        onChange={(e) => handleInputChange('customerSupportNumber', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
                      />
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setProfileSubStep('F')}
                        className="px-4 py-2 border border-blue-200/80 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-6 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <span>Review & Submit Application</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: REVIEW & SUBMIT APPLICATION */}
            {step === 3 && (
              <div className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="text-center space-y-2 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold font-display text-navy-950">Review Your Registration Details</h2>
                  <p className="text-xs text-slate-500">
                    Verify all business credentials, GST details, bank proof and delivery settings before final submission to BuildGhar Admin.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Summary Box 1 */}
                  <div className="p-4 bg-sky-50/30 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                      <span className="font-bold text-navy-950">1. Business Profile</span>
                      <button onClick={() => { setStep(2); setProfileSubStep('A'); }} className="text-blue-700 font-bold underline">Edit</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div><span className="text-slate-400">Firm Name:</span> <strong className="text-slate-900 block">{formData.businessName}</strong></div>
                      <div><span className="text-slate-400">Owner:</span> <strong className="text-slate-900 block">{formData.ownerName}</strong></div>
                      <div><span className="text-slate-400">Phone:</span> <strong className="text-slate-900 block font-mono">+91 {formData.phone}</strong></div>
                      <div><span className="text-slate-400">GSTIN:</span> <strong className="text-slate-900 block font-mono">{formData.gstin}</strong></div>
                    </div>
                  </div>

                  {/* Summary Box 2 */}
                  <div className="p-4 bg-sky-50/30 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                      <span className="font-bold text-navy-950">2. Godown Location & Bank Details</span>
                      <button onClick={() => { setStep(2); setProfileSubStep('C'); }} className="text-blue-700 font-bold underline">Edit</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div><span className="text-slate-400">City / State:</span> <strong className="text-slate-900 block">{formData.city}, {formData.state}</strong></div>
                      <div><span className="text-slate-400">Bank Name:</span> <strong className="text-slate-900 block">{formData.bankName || 'State Bank of India'}</strong></div>
                      <div><span className="text-slate-400">Account No:</span> <strong className="text-slate-900 block font-mono">****{formData.accountNumber.slice(-4) || '8291'}</strong></div>
                      <div><span className="text-slate-400">IFSC:</span> <strong className="text-slate-900 block font-mono">{formData.ifsc || 'SBIN0001234'}</strong></div>
                    </div>
                  </div>

                  {/* Summary Box 3 */}
                  <div className="p-4 bg-sky-50/30 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                      <span className="font-bold text-navy-950">3. Uploaded KYC Documents</span>
                      <button onClick={() => { setStep(2); setProfileSubStep('D'); }} className="text-blue-700 font-bold underline">Edit</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.documents || []).map((d) => (
                        <span key={d.id} className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-lg font-medium text-[11px] flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{d.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    By submitting your application, you certify that all uploaded documents and GST registrations are authentic and belong to the applicant business entity. BuildGhar reserves the right to audit weighbridge slips and material certifications.
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 border border-blue-200/80 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmitApplication}
                    className="px-8 py-3 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    <span>{loading ? 'Submitting Application...' : 'Submit Application for Admin Approval'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS / SUBMITTED */}
            {step === 4 && (
              <div className="bg-white rounded-3xl border border-blue-200/80 p-8 sm:p-10 shadow-sm text-center space-y-5 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
                    Application Status: Under Review
                  </span>
                  <h2 className="text-2xl font-black font-display text-navy-950 mt-2">
                    Application Submitted Successfully!
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                    Your vendor profile for <strong>{formData.businessName}</strong> has been transmitted to BuildGhar Operations and Compliance Cell.
                  </p>
                </div>

                <div className="p-4 bg-sky-50/30 border border-blue-200/80 rounded-2xl text-left space-y-2 text-xs">
                  <div className="font-bold text-slate-800">What Happens Next?</div>
                  <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                    <li>Compliance team verifies GSTIN, PAN, and cancelled cheque (within 24-48 hours).</li>
                    <li>You will receive an SMS and WhatsApp notification once approved.</li>
                    <li>Upon approval, your login opens the complete Vendor Panel to list products & receive orders.</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLookupPhone(formData.phone);
                      setViewMode('STATUS_CHECK');
                      setSearched(true);
                      setFoundApplication(getVendorByPhone(formData.phone) || null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                  >
                    Track Live Status
                  </button>
                  <Link
                    to="/vendor"
                    className="w-full sm:w-auto px-5 py-2.5 bg-navy-950 text-gold-400 rounded-xl text-xs font-bold hover:bg-navy-900 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Go to Vendor Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
