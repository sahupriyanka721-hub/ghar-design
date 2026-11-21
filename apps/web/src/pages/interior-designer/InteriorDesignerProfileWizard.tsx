import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  User,
  Building2,
  Layers,
  Award,
  FileCheck2,
  ImageIcon,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Eye,
  FileText,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  ALL_INTERIOR_SPECIALIZATIONS,
  ALL_INTERIOR_BUSINESS_TYPES,
  InteriorDesignerBusinessType,
  InteriorPricingMethod,
  InteriorPortfolioProject,
  InteriorKycDocument,
  getInteriorDesignerByPhone,
  saveInteriorDesignerAccount,
} from '../../data/interiorDesignerStore.js';
import { saveOriginalFile } from '../../lib/documentStore.js';

export const InteriorDesignerProfileWizard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [activeUploadDocId, setActiveUploadDocId] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 8;

  // Step 1: Personal Details
  const [personal, setPersonal] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    alternatePhone: '',
    profilePhoto: '',
    dob: '',
    gender: '',
    residentialAddress: '',
    state: '',
    city: '',
    district: '',
    pincode: '',
  });

  // Step 2: Business Details
  const [business, setBusiness] = useState({
    businessName: '',
    businessType: 'Interior Design Center' as InteriorDesignerBusinessType,
    businessRegistrationDate: '',
    businessAddress: '',
    officeContact: '',
    businessEmail: '',
    website: '',
    yearsOfExperience: '' as any,
    teamSize: '' as any,
    completedProjectsCount: '' as any,
    businessDescription: '',
    serviceAreas: '',
    serviceCities: [] as string[],
    availableForNewProjects: true,
  });

  // Step 3: Specializations & Pricing
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [preferredProjectTypes, setPreferredProjectTypes] = useState<string>('');
  const [minBudget, setMinBudget] = useState<number | ''>('');
  const [maxBudget, setMaxBudget] = useState<number | ''>('');
  const [durationWeeks, setDurationWeeks] = useState<number | ''>('');
  const [consultationFee, setConsultationFee] = useState<number | ''>('');
  const [pricingMethod, setPricingMethod] = useState<InteriorPricingMethod>('Per Square Foot');
  const [providesMaterials, setProvidesMaterials] = useState<boolean>(true);
  const [providesExecution, setProvidesExecution] = useState<boolean>(true);
  const [worksWithContractors, setWorksWithContractors] = useState<boolean>(true);

  // Step 4: Professional Qualifications
  const [qualification, setQualification] = useState({
    highestQualification: '',
    degreeName: '',
    institutionName: '',
    completionYear: '' as any,
    certifications: '',
    memberships: '',
    previousFirms: '',
  });

  // Step 5: KYC Documents
  const [documents, setDocuments] = useState<InteriorKycDocument[]>([
    {
      id: 'doc-pan',
      documentType: 'PAN_CARD',
      title: 'Business / Individual PAN Card',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-aadhaar',
      documentType: 'AADHAAR_CARD',
      title: 'Aadhaar / Government Identity Proof',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-reg',
      documentType: 'BUSINESS_REGISTRATION',
      title: 'Business Registration / GST Certificate',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-degree',
      documentType: 'QUALIFICATION_CERTIFICATE',
      title: 'Professional Degree / Diploma Certificate',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
  ]);

  // Step 6: Portfolio Projects
  const [portfolioProjects, setPortfolioProjects] = useState<InteriorPortfolioProject[]>([]);

  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<InteriorPortfolioProject>>({
    title: '',
    category: '',
    location: '',
    budgetRange: '',
    builtUpArea: '',
    completionYear: '',
    description: '',
    renderImageUrl: '',
  });

  // Step 7: Bank & Payout Details
  const [bank, setBank] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  // Step 8: Declarations
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  // Load existing draft if present
  useEffect(() => {
    if (user?.phone) {
      const existing = getInteriorDesignerByPhone(user.phone);
      if (existing) {
        setPersonal((prev) => ({
          ...prev,
          name: existing.name || prev.name,
          phone: existing.phone || prev.phone,
          email: existing.email || prev.email,
          city: existing.city || prev.city,
          state: existing.state || prev.state,
          pincode: existing.pincode || prev.pincode,
        }));
        setBusiness((prev) => ({
          ...prev,
          businessName: existing.businessName || prev.businessName,
          businessType: existing.businessType || prev.businessType,
          yearsOfExperience: existing.yearsOfExperience || prev.yearsOfExperience,
          teamSize: existing.teamSize || prev.teamSize,
          completedProjectsCount: existing.completedProjectsCount || prev.completedProjectsCount,
          businessDescription: existing.businessDescription || prev.businessDescription,
        }));
        if (existing.specializations && existing.specializations.length > 0) {
          setSpecializations(existing.specializations);
        }
        if (existing.portfolioProjects && existing.portfolioProjects.length > 0) {
          setPortfolioProjects(existing.portfolioProjects);
        }
        if (existing.documents && existing.documents.length > 0) {
          setDocuments(existing.documents);
        }
        if (existing.bankDetails) {
          setBank((prev) => ({
            accountHolderName: existing.bankDetails.accountHolderName || prev.accountHolderName || '',
            bankName: existing.bankDetails.bankName || prev.bankName || '',
            accountNumber: existing.bankDetails.accountNumber || prev.accountNumber || '',
            ifscCode: existing.bankDetails.ifscCode || prev.ifscCode || '',
            upiId: existing.bankDetails.upiId || prev.upiId || '',
          }));
        }
      }
    }
  }, [user]);

  const toggleSpecialization = (name: string) => {
    if (specializations.includes(name)) {
      if (specializations.length === 1) {
        error('Please select at least one interior specialization');
        return;
      }
      setSpecializations(specializations.filter((s) => s !== name));
    } else {
      setSpecializations([...specializations, name]);
    }
  };

  const handleAddProject = () => {
    if (!newProject.title || !newProject.builtUpArea) {
      error('Please provide project title and built-up area');
      return;
    }
    const created: InteriorPortfolioProject = {
      id: `i-port-${Date.now()}`,
      title: newProject.title || 'Residential Interior',
      category: newProject.category || 'Residential Apartment',
      location: newProject.location || 'Gurugram',
      budgetRange: newProject.budgetRange || '₹25 Lakhs',
      builtUpArea: newProject.builtUpArea || '2,400 sq.ft',
      completionYear: newProject.completionYear || '2025',
      description: newProject.description || 'Full-home interior architecture & styling.',
      renderImageUrl: newProject.renderImageUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    };
    setPortfolioProjects([...portfolioProjects, created]);
    setShowAddProjectModal(false);
    setNewProject({
      title: '',
      category: '',
      location: '',
      budgetRange: '',
      builtUpArea: '',
      completionYear: '',
      description: '',
      renderImageUrl: '',
    });
    success('Portfolio project added!');
  };

  const triggerFileUpload = (docId: string) => {
    setActiveUploadDocId(docId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadDocId) return;

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const cleanUserPhone = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
    const targetDocId = activeUploadDocId;
    const docStorageKey = `designer_doc_${cleanUserPhone || 'guest'}_${targetDocId}`;

    try {
      const savedDoc = await saveOriginalFile(docStorageKey, file);

      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id === targetDocId) {
            return {
              ...d,
              fileName: file.name,
              fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              fileSize: `${sizeFormatted} (${extension}) - ${file.name}`,
              fileUrl: savedDoc.dataUrl,
              storageKey: docStorageKey,
              isOriginalUpload: true,
              uploadedAt: new Date().toISOString(),
              status: 'PENDING' as const,
            };
          }
          return d;
        })
      );

      success(`Original file "${file.name}" (${sizeFormatted}) uploaded successfully!`);
    } catch (err) {
      console.warn('Failed to save document:', err);
      error('Failed to upload file');
    }
    setActiveUploadDocId(null);
  };

  const handleSimulateUpload = (docId: string, title: string) => {
    triggerFileUpload(docId);
  };

  const handleSaveDraft = () => {
    const cleanPh = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
    saveInteriorDesignerAccount({
      phone: cleanPh,
      name: personal.name,
      email: personal.email,
      state: personal.state,
      city: personal.city,
      pincode: personal.pincode,
      businessName: business.businessName,
      businessType: business.businessType,
      yearsOfExperience: Number(business.yearsOfExperience) || 0,
      teamSize: Number(business.teamSize) || 1,
      completedProjectsCount: Number(business.completedProjectsCount) || 0,
      businessDescription: business.businessDescription,
      specializations,
      portfolioProjects,
      documents,
      accountStatus: 'PROFILE_INCOMPLETE',
    });
    success('Draft saved successfully! You can resume anytime.');
  };

  const handleFinalSubmit = () => {
    if (!declarationAgreed) {
      error('Please accept the accuracy declaration and BuildGhar professional terms');
      return;
    }

    const cleanPh = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
    const saved = saveInteriorDesignerAccount({
      phone: cleanPh,
      name: personal.name,
      email: personal.email,
      alternatePhone: personal.alternatePhone,
      profilePhoto: personal.profilePhoto,
      dob: personal.dob,
      gender: personal.gender,
      residentialAddress: personal.residentialAddress,
      state: personal.state,
      city: personal.city,
      district: personal.district,
      pincode: personal.pincode,
      businessName: business.businessName,
      businessType: business.businessType,
      businessRegistrationDate: business.businessRegistrationDate,
      businessAddress: business.businessAddress,
      officeContact: business.officeContact,
      businessEmail: business.businessEmail,
      website: business.website,
      yearsOfExperience: Number(business.yearsOfExperience) || 0,
      teamSize: Number(business.teamSize) || 1,
      completedProjectsCount: Number(business.completedProjectsCount) || 0,
      businessDescription: business.businessDescription,
      serviceAreas: (business.serviceAreas || '').split(',').map((s) => s.trim()).filter(Boolean),
      serviceCities: business.serviceCities,
      availableForNewProjects: business.availableForNewProjects,
      specializations,
      preferredProjectTypes: (preferredProjectTypes || '').split(',').map((s) => s.trim()).filter(Boolean),
      minProjectBudget: Number(minBudget) || 0,
      maxProjectBudget: Number(maxBudget) || 0,
      typicalDurationWeeks: Number(durationWeeks) || 0,
      consultationFee: Number(consultationFee) || 0,
      pricingMethod,
      providesMaterials,
      providesExecution,
      worksWithContractors,
      highestQualification: qualification.highestQualification,
      degreeName: qualification.degreeName,
      institutionName: qualification.institutionName,
      completionYear: Number(qualification.completionYear) || new Date().getFullYear(),
      certifications: qualification.certifications,
      memberships: qualification.memberships,
      previousFirms: qualification.previousFirms,
      documents,
      portfolioProjects,
      bankDetails: {
        accountHolderName: bank.accountHolderName,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        upiId: bank.upiId,
        isVerified: false,
      },
      accountStatus: 'PENDING_APPROVAL',
      isVerified: false,
    });

    success('Application submitted successfully! Your credentials are now under review.');
    navigate('/interior-designer/application-status');
  };

  const stepsList = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Business', icon: Building2 },
    { num: 3, label: '19 Specializations', icon: Layers },
    { num: 4, label: 'Qualifications', icon: Award },
    { num: 5, label: 'KYC Docs', icon: FileCheck2 },
    { num: 6, label: 'Portfolio', icon: ImageIcon },
    { num: 7, label: 'Bank & Payouts', icon: CreditCard },
    { num: 8, label: 'Review & Submit', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdfa] via-white to-[#e6f8f5] text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" subtitle="Interior Designer Portal" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="text-xs font-bold text-slate-600 hover:text-navy-950 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              Save as Draft
            </button>
            <Link
              to="/interior-designer/application-status"
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 transition"
            >
              Status Tracker
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-navy-950 text-xs font-black uppercase font-mono mb-2">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Interior Designer Onboarding Wizard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Build Your Interior Design Center Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete the 8 sections below to submit your credentials to our Operations Governance Desk.
          </p>
        </div>

        {/* Step Indicator Pills */}
        <div className="mb-8 grid grid-cols-4 sm:grid-cols-8 gap-2">
          {stepsList.map((s) => {
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-teal-700 shadow-md scale-[1.02]'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold">{s.num}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <s.icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-blue-200' : 'text-slate-400'}`} />
                  )}
                </div>
                <div className="font-black text-[11px] truncate">{s.label}</div>
              </button>
            );
          })}
        </div>

        {/* Wizard Form Panels */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-100 shadow-sm">
          {/* ---------------- STEP 1: PERSONAL DETAILS ---------------- */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Step 1: Personal Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Details of the principal interior designer or firm head.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personal.name}
                    onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verified Mobile Number
                  </label>
                  <input
                    type="tel"
                    disabled
                    value={personal.phone}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alternate Contact Number
                  </label>
                  <input
                    type="tel"
                    value={personal.alternatePhone}
                    onChange={(e) => setPersonal({ ...personal, alternatePhone: e.target.value })}
                    placeholder="Enter alternate contact number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={personal.dob}
                    onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={personal.gender}
                    onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Residential Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personal.residentialAddress}
                    onChange={(e) => setPersonal({ ...personal, residentialAddress: e.target.value })}
                    placeholder="Residential street address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personal.city}
                    onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                    placeholder="Enter city"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personal.state}
                    onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                    placeholder="Enter state"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={personal.pincode}
                    onChange={(e) => setPersonal({ ...personal, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter 6-digit PIN code"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 2: BUSINESS DETAILS ---------------- */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Step 2: Business & Firm Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Business entity details for customer invoicing, agreements, and team coordination.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={business.businessName}
                    onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                    placeholder="Enter registered business / studio name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Entity Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={business.businessType}
                    onChange={(e) => setBusiness({ ...business, businessType: e.target.value as InteriorDesignerBusinessType })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {ALL_INTERIOR_BUSINESS_TYPES.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Years of Experience <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={business.yearsOfExperience || ''}
                    onChange={(e) => setBusiness({ ...business, yearsOfExperience: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Team Members Count <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={business.teamSize || ''}
                    onChange={(e) => setBusiness({ ...business, teamSize: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Completed Projects Count <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={business.completedProjectsCount || ''}
                    onChange={(e) => setBusiness({ ...business, completedProjectsCount: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Office Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={business.businessAddress}
                    onChange={(e) => setBusiness({ ...business, businessAddress: e.target.value })}
                    placeholder="Studio / office street address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Business Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={business.businessDescription}
                    onChange={(e) => setBusiness({ ...business, businessDescription: e.target.value })}
                    placeholder="Describe your design aesthetics, craftsmanship, modular factory capabilities, and client philosophy."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Areas and PIN codes served (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={business.serviceAreas}
                    onChange={(e) => setBusiness({ ...business, serviceAreas: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={business.availableForNewProjects}
                      onChange={(e) => setBusiness({ ...business, availableForNewProjects: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Available for New Projects</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 3: 19 SPECIALIZATIONS ---------------- */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span>Step 3: Interior Design Specializations & Pricing</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select the interior services your firm is equipped to deliver.
                  </p>
                </div>
                <div className="text-xs font-bold px-3 py-1 bg-blue-100 text-navy-950 rounded-full font-mono">
                  {specializations.length} of {ALL_INTERIOR_SPECIALIZATIONS.length} Selected
                </div>
              </div>

              {/* Specializations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_INTERIOR_SPECIALIZATIONS.map((srv, idx) => {
                  const isChecked = specializations.includes(srv.name);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSpecialization(srv.name)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isChecked
                          ? 'bg-blue-50/90 border-blue-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isChecked ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {srv.category}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <h4 className="text-xs font-bold text-navy-950 mb-1">{srv.name}</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">{srv.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Project Budget & Commercial Scope */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Minimum Project Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={minBudget || ''}
                    onChange={(e) => setMinBudget(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Maximum Project Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={maxBudget || ''}
                    onChange={(e) => setMaxBudget(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pricing Method
                  </label>
                  <select
                    value={pricingMethod}
                    onChange={(e) => setPricingMethod(e.target.value as InteriorPricingMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Per Square Foot">Per Square Foot</option>
                    <option value="Fixed Price">Fixed Price</option>
                    <option value="Percentage of Project Cost">Percentage of Project Cost</option>
                    <option value="Custom Estimate">Custom Estimate</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providesMaterials}
                    onChange={(e) => setProvidesMaterials(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Provides Raw & Finished Materials</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providesExecution}
                    onChange={(e) => setProvidesExecution(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Provides On-Site Execution & Installation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={worksWithContractors}
                    onChange={(e) => setWorksWithContractors(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Works with Client's Third-Party Contractors</span>
                </label>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 4: QUALIFICATIONS ---------------- */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span>Step 4: Professional Qualifications & Certifications</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Educational background, design academy degrees, and professional institute memberships.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Highest Qualification <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={qualification.highestQualification}
                    onChange={(e) => setQualification({ ...qualification, highestQualification: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Degree / Diploma Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={qualification.degreeName}
                    onChange={(e) => setQualification({ ...qualification, degreeName: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institution / University Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={qualification.institutionName}
                    onChange={(e) => setQualification({ ...qualification, institutionName: e.target.value })}
                    placeholder="Enter institute or university name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Year of Completion <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={qualification.completionYear || ''}
                    onChange={(e) => setQualification({ ...qualification, completionYear: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Professional Certifications (Optional)
                  </label>
                  <input
                    type="text"
                    value={qualification.certifications}
                    onChange={(e) => setQualification({ ...qualification, certifications: e.target.value })}
                    placeholder="Certifications (optional)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Professional Memberships
                  </label>
                  <input
                    type="text"
                    value={qualification.memberships}
                    onChange={(e) => setQualification({ ...qualification, memberships: e.target.value })}
                    placeholder="Memberships (optional)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 5: KYC DOCUMENTS ---------------- */}
          {currentStep === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Hidden Real File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
              />

              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-blue-600" />
                  <span>Step 5: Business & KYC Documents</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload PDF or image copies for identity, business registration, and qualification verification.
                </p>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => {
                  const isUploaded = Boolean(doc.fileSize && !doc.fileSize.includes('Pending') && !doc.fileSize.includes('No document') && doc.fileUrl && doc.fileUrl !== '#');
                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                          {isUploaded ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-xs font-black text-navy-950">{doc.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Status:{' '}
                            <span className={`font-bold uppercase ${isUploaded ? 'text-blue-700' : 'text-amber-700'}`}>
                              {isUploaded ? 'ATTACHED' : 'PENDING UPLOAD'}
                            </span>
                            {isUploaded && doc.fileSize ? (
                              <span> • {doc.fileSize}</span>
                            ) : (
                              <span className="text-slate-400 italic"> • No document attached yet</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleSimulateUpload(doc.id, doc.title)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploaded ? 'Replace PDF / File' : 'Upload / Attach PDF'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 6: PORTFOLIO & PREVIOUS PROJECTS ---------------- */}
          {currentStep === 6 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <span>Step 6: Completed Portfolio & Before/After Renders</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Showcase past residential transformations to attract high-intent landowners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Portfolio Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolioProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-slate-100">
                        <img
                          src={p.renderImageUrl || p.afterImageUrl}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-navy-950/80 backdrop-blur-md text-white text-[10px] font-bold">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-black text-navy-950">{p.title}</h4>
                        <button
                          type="button"
                          onClick={() => setPortfolioProjects(portfolioProjects.filter((item) => item.id !== p.id))}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{p.location}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-slate-700">{p.builtUpArea}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{p.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                      <span>Completed: {p.completionYear}</span>
                      <span className="text-emerald-600 font-bold">Verified Partner Entry</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Project Modal */}
              {showAddProjectModal && (
                <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-base font-black text-navy-950">Add Portfolio Project</h4>
                      <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Project Title *</label>
                        <input
                          type="text"
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          placeholder=""
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Category</label>
                          <input
                            type="text"
                            value={newProject.category}
                            onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                            placeholder="Residential Villa"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Built-Up Area *</label>
                          <input
                            type="text"
                            value={newProject.builtUpArea}
                            onChange={(e) => setNewProject({ ...newProject, builtUpArea: e.target.value })}
                            placeholder="3,400 sq.ft"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Location / Sector</label>
                        <input
                          type="text"
                          value={newProject.location}
                          onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                          placeholder=""
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">3D Render / Photography Image URL</label>
                        <input
                          type="url"
                          value={newProject.renderImageUrl}
                          onChange={(e) => setNewProject({ ...newProject, renderImageUrl: e.target.value })}
                          placeholder="https://... (image URL)"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Project Description</label>
                        <textarea
                          rows={2}
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          placeholder="Brief description of the styling elements, features, etc."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddProjectModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddProject}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      >
                        Save Project
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ---------------- STEP 7: BANK & PAYOUT DETAILS ---------------- */}
          {currentStep === 7 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Step 7: Bank & Payout Settlement Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bank credentials for receiving 100% escrow milestone payouts upon client stage approvals.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Holder Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bank.accountHolderName}
                    onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                    placeholder="Enter account holder name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bank.bankName}
                    onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                    placeholder="Enter bank name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                    placeholder="Enter bank account number (9-18 digits)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IFSC Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={bank.ifscCode}
                    onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) })}
                    placeholder="Enter 11-digit IFSC code"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={bank.upiId}
                    onChange={(e) => setBank({ ...bank, upiId: e.target.value })}
                    placeholder="Enter UPI ID (optional)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 8: DECLARATION & FINAL SUBMIT ---------------- */}
          {currentStep === 8 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Step 8: Declaration & Final Submission</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review your application summary before dispatching to the Operations Governance Desk.
                </p>
              </div>

              {/* Summary Box */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 text-xs">
                <div className="font-black text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-blue-700" />
                  <span>Application Summary for Governance Desk</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Lead Designer:</span>{' '}
                    <strong className="text-navy-950">{personal.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Firm Name:</span>{' '}
                    <strong className="text-navy-950">{business.businessName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Entity:</span>{' '}
                    <strong className="text-navy-950">{business.businessType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Experience:</span>{' '}
                    <strong className="text-navy-950">{business.yearsOfExperience} Years (Team of {business.teamSize})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Specializations:</span>{' '}
                    <strong className="text-navy-950">{specializations.length} Services Selected</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Portfolio Projects:</span>{' '}
                    <strong className="text-navy-950">{portfolioProjects.length} Verified Entries</strong>
                  </div>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={declarationAgreed}
                    onChange={(e) => setDeclarationAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    I hereby declare that all information, professional degrees, statutory certificates, and past portfolio projects submitted are accurate. I agree to the BuildGhar Professional Partner Code of Conduct and Escrow Milestone Terms.
                  </span>
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Our Governance Desk audits applications within <strong>24 to 48 hours</strong>. You can monitor review progress on your status tracker.
                </span>
              </div>
            </motion.div>
          )}

          {/* Controls Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-md"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black transition flex items-center gap-2 shadow-lg"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Profile for Verification</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
