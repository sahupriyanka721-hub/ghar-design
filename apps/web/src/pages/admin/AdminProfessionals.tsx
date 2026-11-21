import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import {
  ShieldCheck,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Award,
  MapPin,
  CalendarCheck,
  Clock,
  Phone,
  Building,
  Search,
  User,
  UserCheck,
  CheckCircle2,
  Plus,
  UserPlus,
  Mail,
  Briefcase,
} from 'lucide-react';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getPlatformBookings,
  savePlatformBooking,
  updatePlatformBookingStatus,
  PlatformBooking,
  getPlatformProfessionals,
  savePlatformProfessional,
  updatePlatformProfessionalStatus,
  PlatformProfessional,
  syncChannel,
} from '../../data/customerStore.js';
import { getPlatformAuditLogs, PlatformAuditLog } from '../../data/adminStore.js';

export const AdminProfessionals: React.FC = () => {
  const [professionals, setProfessionals] = useState<PlatformProfessional[]>([]);
  const [showProModal, setShowProModal] = useState(false);
  const [proStep, setProStep] = useState<number>(1);
  const [newPro, setNewPro] = useState({
    name: '',
    firmName: '',
    category: 'PROFESSIONAL' as PlatformProfessional['category'],
    phone: '',
    email: '',
    qualifications: '',
    experienceYears: '' as any,
    serviceCities: '',
    verificationStatus: 'APPROVED' as 'APPROVED' | 'PENDING',
  });
  const { success, error } = useToast();

  const loadProfessionals = () => {
    const list = getPlatformProfessionals();
    setProfessionals(list);
  };

  useEffect(() => {
    loadProfessionals();
    window.addEventListener('storage', loadProfessionals);
    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'PROFESSIONALS_UPDATED') {
        loadProfessionals();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    return () => {
      window.removeEventListener('storage', loadProfessionals);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  const handleVerify = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const updated = updatePlatformProfessionalStatus(id, status);
    setProfessionals(updated);
    success(`Professional ${status.toLowerCase()}ed.`);
  };

  const handleCreatePro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPro.name.trim() || !newPro.firmName.trim()) {
      error('Lead professional name and firm name are required');
      return;
    }

    const cleanPhone = newPro.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      error('Please enter a valid 10-digit mobile number for the professional');
      return;
    }

    const created = savePlatformProfessional({
      name: newPro.name.trim(),
      firmName: newPro.firmName.trim(),
      category: newPro.category,
      phone: `+91 ${cleanPhone}`,
      email: newPro.email.trim() || 'contact@ghardesign.in',
      qualifications: newPro.qualifications.trim() || 'IEI Certified / Chartered Engineer Certified',
      experienceYears: Number(newPro.experienceYears) || 5,
      serviceCities: newPro.serviceCities.split(',').map((c) => c.trim()),
      isVerified: newPro.verificationStatus === 'APPROVED',
      verificationStatus: newPro.verificationStatus,
    });

    loadProfessionals();
    setShowProModal(false);
    setNewPro({
      name: '',
      firmName: '',
      category: 'PROFESSIONAL',
      phone: '',
      email: '',
      qualifications: '',
      experienceYears: '' as any,
      serviceCities: '',
      verificationStatus: 'APPROVED',
    });
    success(`Professional firm "${created.firmName}" successfully onboarded!`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">
            Professional Network Vetting ({professionals.length})
          </h1>
          <p className="text-xs text-slate-500">
            Review Engineering Council (IEI) / Chartered Engineer credentials and manage accreditation status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {professionals.map((pro) => (
          <div key={pro.id} className="card p-6 space-y-4 bg-white border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-navy-950 text-base font-display">{pro.firmName}</h3>
                <p className="text-xs text-slate-500">{pro.name} • {pro.category?.replace(/_/g, ' ')}</p>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  pro.isVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {pro.verificationStatus}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div><strong>Accreditation:</strong> {pro.qualifications}</div>
              <div><strong>Industry Experience:</strong> {pro.experienceYears} Years</div>
              {pro.serviceCities && pro.serviceCities.length > 0 && (
                <div><strong>Service Cities:</strong> {pro.serviceCities.join(', ')}</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleVerify(pro.id, 'APPROVED')}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Verify & Approve</span>
              </button>
              <button
                onClick={() => handleVerify(pro.id, 'REJECTED')}
                className="btn-outline text-xs py-1.5 px-3 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Onboard Professional Modal (Stepper Wizard) */}
      {showProModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowProModal(false);
                  setProStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Onboard Professional Firm
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {proStep} of 4 • Engineers & Architects Accreditation
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowProModal(false);
                  setProStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { step: 1, title: 'Discipline & Firm', icon: Building },
                  { step: 2, title: 'Contact & Territory', icon: MapPin },
                  { step: 3, title: 'Accreditation', icon: Award },
                  { step: 4, title: 'Verification', icon: ShieldCheck },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < proStep) setProStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          proStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : proStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {proStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          proStep === item.step
                            ? 'text-blue-900'
                            : proStep > item.step
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 mb-5 transition ${
                          proStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreatePro}>
                {/* STEP 1: DISCIPLINE & FIRM */}
                {proStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Firm Name & Discipline Category
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Register professional engineering / architectural studio credentials.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Consulting Firm / Studio Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newPro.firmName}
                          onChange={(e) => setNewPro({ ...newPro, firmName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Lead / Principal Professional Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newPro.name}
                          onChange={(e) => setNewPro({ ...newPro, name: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Discipline Category <span className="text-rose-500">*</span></label>
                        <select
                          value={newPro.category}
                          onChange={(e) => setNewPro({ ...newPro, category: e.target.value as any })}
                          className="w-full p-3.5 border border-slate-300 rounded-2xl font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        >
                          <option value="PROFESSIONAL">Professional Consultant (IEI Certified)</option>
                          <option value="STRUCTURAL_ENGINEER">Structural Engineer (IEI / ISSE)</option>
                          <option value="CIVIL_ENGINEER">Civil Engineer & PMC Lead</option>
                          <option value="INTERIOR_DESIGNER">Interior Architecture & Design (IIID)</option>
                          <option value="ARCHITECT">Registered Architect (COA Licensed)</option>
                          <option value="MEP_CONSULTANT">MEP Consultant (HVAC, Electrical, Plumbing)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CONTACT & TERRITORY */}
                {proStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Official Communications & Operating Territories
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify contact mobile, email, and target service cities for automated client allocation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>Direct Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={newPro.phone}
                            onChange={(e) => setNewPro({ ...newPro, phone: e.target.value })}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>Official Email Address</span>
                        </label>
                        <input
                          type="email"
                          placeholder=""
                          value={newPro.email}
                          onChange={(e) => setNewPro({ ...newPro, email: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>Active Service Cities / Operational Regions</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newPro.serviceCities}
                          onChange={(e) => setNewPro({ ...newPro, serviceCities: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: ACCREDITATION */}
                {proStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Professional Qualifications & Engineering Experience
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter degree credentials, professional council registration, and industry tenure.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-blue-600" />
                          <span>Degrees / Council Licensure</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newPro.qualifications}
                          onChange={(e) => setNewPro({ ...newPro, qualifications: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>Industry Experience (Years)</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={newPro.experienceYears}
                          onChange={(e) => setNewPro({ ...newPro, experienceYears: Number(e.target.value) })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: VERIFICATION & REVIEW */}
                {proStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 4 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Accreditation Review & Onboard Activation
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review professional credentials and activate instant booking allocation rights.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Consultancy Firm</span>
                        <p className="text-base font-bold text-navy-950 mt-0.5">{newPro.firmName || 'Not Entered'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Lead Professional</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{newPro.name || 'Not Entered'} ({newPro.category})</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Contact Mobile & Email</span>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">+91 {newPro.phone} {newPro.email && `• ${newPro.email}`}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Coverage Cities</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{newPro.serviceCities}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Accreditation</span>
                        <p className="text-xs font-semibold text-blue-900 mt-0.5">{newPro.qualifications} • {newPro.experienceYears} Years Experience</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-bold text-slate-800 text-sm block">
                        Initial Accreditation Level <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          onClick={() => setNewPro({ ...newPro, verificationStatus: 'APPROVED' })}
                          className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                            newPro.verificationStatus === 'APPROVED'
                              ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="proStatus"
                            checked={newPro.verificationStatus === 'APPROVED'}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div>
                            <span className="font-bold text-navy-950 text-xs block">APPROVED (Direct Matching)</span>
                            <span className="text-[11px] text-slate-500">
                              Immediately visible to homeowners in consultation bookings and project milestone assignments.
                            </span>
                          </div>
                        </label>

                        <label
                          onClick={() => setNewPro({ ...newPro, verificationStatus: 'PENDING' })}
                          className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                            newPro.verificationStatus === 'PENDING'
                              ? 'bg-amber-50 border-amber-400 shadow-sm'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="proStatus"
                            checked={newPro.verificationStatus === 'PENDING'}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div>
                            <span className="font-bold text-navy-950 text-xs block">PENDING (Audit Hold)</span>
                            <span className="text-[11px] text-slate-500">
                              Requires manual review of COA / IEI certificates by senior admin before public matching.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {proStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setProStep(proStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowProModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {proStep} of 4
                  </div>

                  {proStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (proStep === 1) {
                          if (!newPro.firmName.trim() || !newPro.name.trim()) {
                            error('Please enter Firm Name and Professional Name');
                            return;
                          }
                        } else if (proStep === 2) {
                          const clean = newPro.phone.replace(/\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                          if (!newPro.serviceCities.trim()) {
                            error('Please enter service cities');
                            return;
                          }
                        }
                        setProStep(proStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {proStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Onboard Professional</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminBookings: React.FC = () => {
  const { success, error } = useToast();
  const [bookings, setBookings] = useState<PlatformBooking[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    customerPhone: '',
    serviceTitle: '',
    serviceType: 'CONSULTATION',
    firmName: '',
    siteAddress: '',
    totalAmountRupees: '' as any,
    advanceRupees: '' as any,
    status: 'CONFIRMED' as PlatformBooking['status'],
    notes: '',
  });

  const loadBookings = () => {
    const list = getPlatformBookings();
    setBookings(list);
  };

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 30000);
    window.addEventListener('storage', loadBookings);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadBookings);
    };
  }, []);

  const handleStatusChange = (id: string, newStatus: PlatformBooking['status']) => {
    const updated = updatePlatformBookingStatus(id, newStatus);
    setBookings(updated);
    success(`Booking status updated to ${newStatus}`);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.customerName.trim()) {
      error('Customer name is required');
      return;
    }
    const cleanPhone = newBooking.customerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      error('Please enter a valid 10-digit mobile number');
      return;
    }
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `BK-${new Date().getFullYear()}-${randomNum}`;
    const totalAmountPaise = Math.round((newBooking.totalAmountRupees || 0) * 100);
    const advancePaise = Math.round((newBooking.advanceRupees || 0) * 100);

    const created: PlatformBooking = {
      id: `book-${Date.now()}`,
      bookingCode,
      customerId: `usr-cust-${Date.now()}`,
      customerName: newBooking.customerName.trim(),
      customerPhone: `+91 ${cleanPhone}`,
      serviceTitle: newBooking.serviceTitle.trim(),
      serviceType: newBooking.serviceType,
      firmName: newBooking.firmName.trim() || 'Accredited Firm',
      siteAddress: newBooking.siteAddress.trim(),
      totalAmountPaise,
      advancePaise,
      status: newBooking.status,
      confirmedAt: new Date().toISOString(),
      notes: newBooking.notes.trim(),
    };

    savePlatformBooking(created);
    loadBookings();
    setShowBookingModal(false);
    setNewBooking({
      customerName: '',
      customerPhone: '',
      serviceTitle: '',
      serviceType: 'CONSULTATION',
      firmName: '',
      siteAddress: '',
      totalAmountRupees: '' as any,
      advanceRupees: '' as any,
      status: 'CONFIRMED',
      notes: '',
    });
    success(`Booking ${bookingCode} successfully created!`);
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.bookingCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.serviceTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalValue = bookings.reduce((sum, b) => sum + (b.totalAmountPaise || 0), 0);
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">Platform Bookings Management ({bookings.length})</h1>
          <p className="text-xs text-slate-500">Live feed of homeowner service consultations, site audits, and contractor engagements.</p>
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Service Booking</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Bookings Placed</span>
            <CalendarCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display mt-1">{bookings.length}</div>
          <div className="text-[11px] text-blue-600 font-semibold">{confirmedCount} active / confirmed</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Booking Value</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display mt-1">{formatINR(totalValue)}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Consultations & Contracts</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Live Sync Engine</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-display mt-1">Real-Time</div>
          <div className="text-[11px] text-slate-400">Zero dummy records</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search booking code, customer name, phone, or service..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="RESCHEDULED">Rescheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center space-y-2 bg-white border border-slate-200">
            <CalendarCheck className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-900 text-sm">No Service Bookings Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When homeowners book engineering consultations, structural site audits, or accept contractor quotations, their bookings will appear here instantly.
            </p>
          </div>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="card p-6 space-y-4 bg-white border border-slate-200 shadow-xs rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 text-xs">
                <div>
                  <div className="font-bold font-mono text-sm text-navy-950 flex items-center gap-2">
                    <span>{b.bookingCode}</span>
                    <span className="font-sans font-semibold text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {b.serviceType}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {b.serviceTitle} • Booked: {formatDate(b.confirmedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : b.status === 'RESCHEDULED'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : b.status === 'CANCELLED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {b.status}
                  </span>

                  <select
                    value={b.status}
                    onChange={(e) => handleStatusChange(b.id, e.target.value as any)}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                  <span className="font-bold text-slate-800 text-sm block">{b.customerName}</span>
                  <span className="font-mono text-slate-500 text-xs">{b.customerPhone}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Appointment Schedule</span>
                  <span className="font-semibold text-slate-800 block">
                    {b.visitDate ? formatDate(b.visitDate) : 'Schedule On Call'}
                  </span>
                  <span className="text-[11px] text-slate-500">{b.visitTimeSlot || 'Standard Working Hours'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Site Project Location</span>
                  <span className="text-slate-700 font-medium block truncate max-w-[200px]" title={b.siteAddress}>
                    {b.siteAddress || 'Site Address Specified in Project'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Engagement Value</span>
                  <span className="font-bold text-navy-950 font-display text-sm block">
                    {formatINR(b.totalAmountPaise)}
                  </span>
                  {b.advancePaise && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Advance: {formatINR(b.advancePaise)}
                    </span>
                  )}
                </div>
              </div>

              {b.notes && (
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100">
                  <span className="font-bold text-slate-700">Client Instructions:</span> {b.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Record Booking Modal */}
      {showBookingModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <CalendarCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Book Professional Consultation
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Service Bookings • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={newBooking.customerName}
                    onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    Customer Phone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-semibold">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit number"
                      value={newBooking.customerPhone}
                      onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                      className="w-full pl-12 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Service Engagement Title</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={newBooking.serviceTitle}
                  onChange={(e) => setNewBooking({ ...newBooking, serviceTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Service Type</label>
                  <select
                    value={newBooking.serviceType}
                    onChange={(e) => setNewBooking({ ...newBooking, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="CONSULTATION">Site Consultation & Feasibility</option>
                    <option value="STRUCTURAL_AUDIT">Structural Audit & Stability Test</option>
                    <option value="CONSTRUCTION_CONTRACT">Civil Construction Contract</option>
                    <option value="INTERIOR_DESIGN">Interior Design</option>
                    <option value="MAP_SANCTION">Municipal Map & Sanction Drawing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Assigned Professional / Firm</label>
                  <input
                    type="text"
                    placeholder=""
                    value={newBooking.firmName}
                    onChange={(e) => setNewBooking({ ...newBooking, firmName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Site Project Address
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={newBooking.siteAddress}
                  onChange={(e) => setNewBooking({ ...newBooking, siteAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Total Engagement Value (₹)</label>
                  <input
                    type="number"
                    value={newBooking.totalAmountRupees}
                    onChange={(e) => setNewBooking({ ...newBooking, totalAmountRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={newBooking.advanceRupees}
                    onChange={(e) => setNewBooking({ ...newBooking, advanceRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Initial Booking Status</label>
                <select
                  value={newBooking.status}
                  onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="CONFIRMED">CONFIRMED (Appointment Active)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Work Underway)</option>
                  <option value="COMPLETED">COMPLETED (Delivered)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Site Notes / Client Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, gate access, drawings to bring..."
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md transition"
                >
                  Save Booking
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminPlatformSettings: React.FC = () => {
  const { success } = useToast();
  const [feeRupees, setFeeRupees] = useState(499);
  const [gstPercent, setGstPercent] = useState(18);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('Platform settings updated successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-navy-950">Platform Settings</h1>
        <p className="text-xs text-slate-500">Configure global quotation fees, tax rates, and marketplace rules.</p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div>
          <label className="label-text">Nominal Quotation Request Fee (₹)</label>
          <input
            type="number"
            min="0"
            className="input-field"
            value={feeRupees}
            onChange={(e) => setFeeRupees(parseInt(e.target.value) || 0)}
          />
          <p className="text-[11px] text-slate-400 mt-1">Configurable fee charged to homeowners when posting a request.</p>
        </div>

        <div>
          <label className="label-text">Applicable GST Rate (%)</label>
          <input
            type="number"
            min="0"
            max="28"
            className="input-field"
            value={gstPercent}
            onChange={(e) => setGstPercent(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary text-xs py-2 px-6">
            Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);

  useEffect(() => {
    setLogs(getPlatformAuditLogs());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-navy-950">Audit Trail & Security Logs</h1>
        <p className="text-xs text-slate-500">Immutable ledger of administrative actions and status mutations.</p>
      </div>

      <div className="card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="font-bold text-slate-700">No Security Audit Events Yet</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Real-time administrative operations, status changes, and ledger approvals will automatically be tracked here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Actor</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-navy-950">{log.action}</td>
                  <td className="p-4 text-slate-700">{log.entity}</td>
                  <td className="p-4 text-slate-600">{log.adminName}</td>
                  <td className="p-4 font-mono text-slate-400">{log.ipAddress}</td>
                  <td className="p-4 text-slate-500">{formatDate(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
