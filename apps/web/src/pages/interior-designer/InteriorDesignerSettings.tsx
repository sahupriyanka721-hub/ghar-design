import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Save,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  getInteriorDesignerByPhone,
  saveInteriorDesignerAccount,
  ALL_INTERIOR_SPECIALIZATIONS,
  InteriorDesignerAccount,
} from '../../data/interiorDesignerStore.js';

export const InteriorDesignerSettings: React.FC = () => {
  const { user } = useAuth();
  const [designer, setDesigner] = useState<InteriorDesignerAccount>(() => {
    return (
      (user?.phone ? getInteriorDesignerByPhone(user.phone) : null) || {
        id: 'id-101',
        applicationId: 'BG-ID-2026-081',
        name: 'Pooja Mehra',
        phone: '',
        email: 'pooja@mehra-interiors.in',
        businessName: 'Pooja Mehra Luxury Living & Interiors',
        businessType: 'Interior Design Center',
        businessAddress: 'Suite 304, DLF Phase 1, Golf Course Road, Gurugram',
        businessEmail: 'contact@mehra-interiors.in',
        yearsOfExperience: 11,
        teamSize: 14,
        completedProjectsCount: 95,
        businessDescription: 'Award-winning Interior Design specializing in luxury residential apartments.',
        state: 'Haryana',
        city: 'Gurugram',
        pincode: '',
        serviceAreas: ['DLF Phase 1-5', 'Golf Course Road', 'Sohna Road', 'South Delhi'],
        serviceCities: ['Gurugram', 'New Delhi', 'Noida'],
        availableForNewProjects: true,
        specializations: [
          'Residential Interior Design',
          'Modular Kitchen',
          'False Ceiling and Lighting',
          'Wardrobe and Storage Design',
          'Complete Interior Projects',
          '3D Interior Visualization',
        ],
        preferredProjectTypes: ['4BHK/5BHK Luxury Apartments', 'Villas & Penthouses'],
        minProjectBudget: 1500000,
        maxProjectBudget: 12000000,
        typicalDurationWeeks: 12,
        consultationFee: 5000,
        pricingMethod: 'Per Square Foot',
        providesMaterials: true,
        providesExecution: true,
        worksWithContractors: true,
        highestQualification: 'Master of Interior Architecture (M.Des)',
        degreeName: 'Interior Architecture & Spatial Design',
        institutionName: 'CEPT University, Ahmedabad',
        completionYear: 2014,
        documents: [],
        portfolioProjects: [],
        accountStatus: 'APPROVED',
        isVerified: true,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleSpec = (name: string) => {
    const exists = designer.specializations.includes(name);
    const updated = exists
      ? designer.specializations.filter((s) => s !== name)
      : [...designer.specializations, name];
    setDesigner({ ...designer, specializations: updated });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveInteriorDesignerAccount(designer);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Professional Profile & Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Update firm public profile, 19 specializations, service areas, and settlement bank details.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings and profile preferences have been successfully updated!</span>
        </motion.div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Profile */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Business Identity</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Business / Brand Name *</label>
              <input
                type="text"
                required
                value={designer.businessName}
                onChange={(e) => setDesigner({ ...designer, businessName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Entity Type *</label>
              <input
                type="text"
                value={designer.businessType}
                onChange={(e) => setDesigner({ ...designer, businessType: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Office Address *</label>
            <input
              type="text"
              required
              value={designer.businessAddress}
              onChange={(e) => setDesigner({ ...designer, businessAddress: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Years of Experience</label>
              <input
                type="number"
                value={designer.yearsOfExperience}
                onChange={(e) => setDesigner({ ...designer, yearsOfExperience: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Team Size</label>
              <input
                type="number"
                value={designer.teamSize}
                onChange={(e) => setDesigner({ ...designer, teamSize: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                value={designer.consultationFee}
                onChange={(e) => setDesigner({ ...designer, consultationFee: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 19 Specializations */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Specializations & Capabilities ({designer.specializations.length} Selected)</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Matches homeowner RFQs in your chosen domains
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {ALL_INTERIOR_SPECIALIZATIONS.map((spec) => {
              const isSelected = designer.specializations.includes(spec.name);
              return (
                <div
                  key={spec.name}
                  onClick={() => handleToggleSpec(spec.name)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 text-navy-950 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{spec.name}</span>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Settlement Bank Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Escrow Settlement Bank Account</span>
          </h3>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">Account Holder Name</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {designer.bankDetails?.accountHolderName || designer.businessName}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">Bank Name</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {designer.bankDetails?.bankName || 'HDFC Bank - DLF Golf Course Road'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">Account Number</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {designer.bankDetails?.accountNumber || '50200084729182'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">IFSC Code</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {designer.bankDetails?.ifscCode || 'HDFC0000421'}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
