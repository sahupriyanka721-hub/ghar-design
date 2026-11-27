import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  Check,
  Globe,
  Phone,
  Mail,
  Lock,
  Save,
  CheckSquare,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  MASTER_INTERIOR_SERVICES,
  ALL_INTERIOR_BUSINESS_TYPES,
  ALL_INTERIOR_REGISTRATION_TYPES,
  InteriorDesignerBusinessType,
  InteriorPricingMethod,
  InteriorPortfolioProject,
  InteriorKycDocument,
  InteriorServiceItem,
  getInteriorDesignerByPhone,
  saveInteriorDesignerAccount,
} from '../../data/interiorDesignerStore.js';
import { saveOriginalFile } from '../../lib/documentStore.js';

export const InteriorDesignerProfileWizard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadDocId, setActiveUploadDocId] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 9;

  // ---------------- STEP A: PERSONAL INFORMATION ----------------
  const [personal, setPersonal] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    alternatePhone: '',
    profilePhoto: '',
    dob: '',
    gender: 'Female',
    residentialAddress: '',
    state: 'Delhi',
    city: 'New Delhi',
    district: '',
    pincode: '',
    country: 'India',
  });

  // ---------------- STEP B: BUSINESS INFORMATION ----------------
  const [business, setBusiness] = useState({
    businessName: '',
    businessType: 'Interior Design Studio' as InteriorDesignerBusinessType,
    businessRegistrationType: 'Private Limited Company',
    businessAddress: '',
    officeContact: '',
    businessEmail: '',
    website: '',
    gstNumber: '',
    businessRegistrationNumber: '',
    yearOfEstablishment: '2020' as any,
    teamSize: '5' as any,
    yearsOfExperience: '6' as any,
    completedProjectsCount: '25' as any,
    businessDescription: '',
  });

  // ---------------- STEP C: QUALIFICATION AND EXPERIENCE ----------------
  const [qualification, setQualification] = useState({
    highestQualification: 'B.Des Interior Design',
    degreeName: 'Bachelor of Design in Interior Architecture',
    institutionName: '',
    completionYear: '2018' as any,
    workExperienceYears: '6' as any,
    specialization: 'Contemporary Luxury & Modular Spaces',
    professionalRegistration: 'IIID Associate Member',
    certifications: 'AutoCAD, 3ds Max / V-Ray, SketchUp Pro',
    previousProjectsDescription: '',
  });

  // ---------------- STEP D: SERVICES OFFERED (23 Services) ----------------
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Residential Interior Design',
    'Living Room Design',
    'Bedroom Design',
    'Modular Kitchen Design',
    'False Ceiling Design',
    'Lighting Design',
    '3D Interior Design',
  ]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [activeServiceCategory, setActiveServiceCategory] = useState<string>('All');
  const [pricingMethod, setPricingMethod] = useState<InteriorPricingMethod>('Per Square Foot');
  const [minBudget, setMinBudget] = useState<number | ''>(500000);
  const [maxBudget, setMaxBudget] = useState<number | ''>(5000000);
  const [typicalDurationWeeks, setTypicalDurationWeeks] = useState<number | ''>(8);
  const [consultationFee, setConsultationFee] = useState<number | ''>(2500);
  const [providesMaterials, setProvidesMaterials] = useState<boolean>(true);
  const [providesExecution, setProvidesExecution] = useState<boolean>(true);
  const [worksWithContractors, setWorksWithContractors] = useState<boolean>(true);

  // ---------------- STEP E: PORTFOLIO MANAGEMENT ----------------
  const [portfolioProjects, setPortfolioProjects] = useState<InteriorPortfolioProject[]>([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<InteriorPortfolioProject>>({
    title: '',
    category: 'Residential Apartment',
    location: '',
    budgetRange: '₹15 - ₹25 Lakhs',
    builtUpArea: '2,200 sq.ft',
    completionYear: '2025',
    description: '',
    renderImageUrl: '',
    afterImageUrl: '',
    beforeImageUrl: '',
    twoDLayoutUrl: '',
  });

  // ---------------- STEP F: KYC & DOCUMENT UPLOAD ----------------
  const [documents, setDocuments] = useState<InteriorKycDocument[]>([
    {
      id: 'doc-pan',
      documentType: 'PAN_CARD',
      title: '1. PAN Card (Individual / Firm)',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-aadhaar',
      documentType: 'AADHAAR_CARD',
      title: '2. Aadhaar / Accepted Identity Document',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-reg',
      documentType: 'BUSINESS_REGISTRATION',
      title: '3. Business Registration / Incorporation Certificate',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-gst',
      documentType: 'GSTIN_CERTIFICATE',
      title: '4. GST Certificate (if applicable)',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-degree',
      documentType: 'QUALIFICATION_CERTIFICATE',
      title: '5. Interior Design Degree / Qualification Certificates',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-address',
      documentType: 'ADDRESS_PROOF',
      title: '6. Office / Studio Address Proof (Utility / Lease)',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-bank',
      documentType: 'BANK_PROOF',
      title: '7. Cancelled Cheque / Bank Proof for Escrow Payouts',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
    {
      id: 'doc-other',
      documentType: 'OTHER_DOCUMENT',
      title: '8. Other Supporting Documents / Accreditations',
      fileUrl: '',
      fileSize: '',
      status: 'PENDING',
      uploadedAt: '',
    },
  ]);

  // ---------------- STEP G: SERVICE AREAS ----------------
  const [serviceAreasState, setServiceAreasState] = useState({
    state: 'Delhi NCR',
    primaryCities: ['Gurugram', 'New Delhi', 'Noida'],
    pincodes: '110001, 110016, 122001, 122002, 201301',
    serviceRadiusKm: 50,
    onSiteServiceAvailable: true,
    onlineConsultationAvailable: true,
  });

  // ---------------- STEP H: BANK DETAILS ----------------
  const [bank, setBank] = useState({
    accountHolderName: '',
    bankName: 'HDFC Bank',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    branch: '',
    accountType: 'Current' as 'Current' | 'Savings',
    upiId: '',
  });

  // ---------------- STEP I: DECLARATION ----------------
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  // Load existing profile or draft if available
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
          residentialAddress: existing.residentialAddress || prev.residentialAddress,
          dob: existing.dob || prev.dob,
          gender: existing.gender || prev.gender,
        }));
        setBusiness((prev) => ({
          ...prev,
          businessName: existing.businessName || prev.businessName,
          businessType: existing.businessType || prev.businessType,
          businessRegistrationType: existing.businessRegistrationType || prev.businessRegistrationType,
          businessAddress: existing.businessAddress || prev.businessAddress,
          businessEmail: existing.businessEmail || prev.businessEmail,
          officeContact: existing.officeContact || prev.officeContact,
          website: existing.website || prev.website,
          gstNumber: existing.gstNumber || prev.gstNumber,
          businessRegistrationNumber: existing.businessRegistrationNumber || prev.businessRegistrationNumber,
          yearsOfExperience: existing.yearsOfExperience || prev.yearsOfExperience,
          teamSize: existing.teamSize || prev.teamSize,
          completedProjectsCount: existing.completedProjectsCount || prev.completedProjectsCount,
          businessDescription: existing.businessDescription || prev.businessDescription,
        }));
        if (existing.servicesOffered && existing.servicesOffered.length > 0) {
          setSelectedServices(existing.servicesOffered);
        } else if (existing.specializations && existing.specializations.length > 0) {
          setSelectedServices(existing.specializations);
        }
        if (existing.portfolioProjects && existing.portfolioProjects.length > 0) {
          setPortfolioProjects(existing.portfolioProjects);
        }
        if (existing.documents && existing.documents.length > 0) {
          setDocuments(existing.documents);
        }
        if (existing.bankDetails) {
          setBank((prev) => ({
            ...prev,
            accountHolderName: existing.bankDetails?.accountHolderName || prev.accountHolderName,
            bankName: existing.bankDetails?.bankName || prev.bankName,
            accountNumber: existing.bankDetails?.accountNumber || prev.accountNumber,
            confirmAccountNumber: existing.bankDetails?.accountNumber || prev.confirmAccountNumber,
            ifscCode: existing.bankDetails?.ifscCode || prev.ifscCode,
            branch: existing.bankDetails?.branch || prev.branch,
            accountType: (existing.bankDetails?.accountType as any) || prev.accountType,
            upiId: existing.bankDetails?.upiId || prev.upiId,
          }));
        }
        if (existing.serviceCities && existing.serviceCities.length > 0) {
          setServiceAreasState((prev) => ({
            ...prev,
            primaryCities: existing.serviceCities,
            serviceRadiusKm: existing.serviceRadiusKm || prev.serviceRadiusKm,
            onSiteServiceAvailable: existing.onSiteServiceAvailable ?? prev.onSiteServiceAvailable,
            onlineConsultationAvailable: existing.onlineConsultationAvailable ?? prev.onlineConsultationAvailable,
            pincodes: existing.servicePincodes ? existing.servicePincodes.join(', ') : prev.pincodes,
          }));
        }
      }
    }
  }, [user]);

  // ---------------- HANDLERS ----------------
  const toggleService = (name: string) => {
    if (selectedServices.includes(name)) {
      if (selectedServices.length === 1) {
        error('Please keep at least one service selected');
        return;
      }
      setSelectedServices(selectedServices.filter((s) => s !== name));
    } else {
      setSelectedServices([...selectedServices, name]);
    }
  };

  const handleSelectAllServices = () => {
    setSelectedServices(MASTER_INTERIOR_SERVICES.map((s) => s.name));
    success('All 23 services selected!');
  };

  const handleClearAllServices = () => {
    setSelectedServices([MASTER_INTERIOR_SERVICES[0].name]);
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
              fileSize: `${sizeFormatted} (${extension}) - ${file.name}`,
              fileUrl: savedDoc.dataUrl,
              uploadedAt: new Date().toISOString(),
              status: 'PENDING' as const,
            };
          }
          return d;
        })
      );

      success(`Document "${file.name}" (${sizeFormatted}) uploaded successfully!`);
    } catch (err) {
      console.warn('Failed to save document:', err);
      error('Failed to process file upload');
    }
    setActiveUploadDocId(null);
  };

  const handleAddProject = () => {
    if (!newProject.title?.trim() || !newProject.builtUpArea?.trim()) {
      error('Please provide project title and built-up area');
      return;
    }
    const created: InteriorPortfolioProject = {
      id: `i-port-${Date.now()}`,
      title: newProject.title.trim(),
      category: newProject.category || 'Residential Apartment',
      location: newProject.location || 'Gurugram',
      budgetRange: newProject.budgetRange || '₹20 Lakhs',
      builtUpArea: newProject.builtUpArea.trim(),
      completionYear: newProject.completionYear || '2025',
      description: newProject.description || 'Full-home architectural interior styling and execution.',
      renderImageUrl: newProject.renderImageUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
      afterImageUrl: newProject.afterImageUrl || newProject.renderImageUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
      beforeImageUrl: newProject.beforeImageUrl,
      twoDLayoutUrl: newProject.twoDLayoutUrl,
    };
    setPortfolioProjects([...portfolioProjects, created]);
    setShowAddProjectModal(false);
    setNewProject({
      title: '',
      category: 'Residential Apartment',
      location: '',
      budgetRange: '₹15 - ₹25 Lakhs',
      builtUpArea: '2,200 sq.ft',
      completionYear: '2025',
      description: '',
      renderImageUrl: '',
      afterImageUrl: '',
      beforeImageUrl: '',
      twoDLayoutUrl: '',
    });
    success('Portfolio project added!');
  };

  const handleSaveDraft = () => {
    const cleanPh = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
    saveInteriorDesignerAccount({
      phone: cleanPh,
      name: personal.name,
      email: personal.email,
      alternatePhone: personal.alternatePhone,
      dob: personal.dob,
      gender: personal.gender,
      residentialAddress: personal.residentialAddress,
      state: personal.state,
      city: personal.city,
      pincode: personal.pincode,
      businessName: business.businessName,
      businessType: business.businessType,
      businessRegistrationType: business.businessRegistrationType,
      businessAddress: business.businessAddress,
      officeContact: business.officeContact,
      businessEmail: business.businessEmail,
      website: business.website,
      gstNumber: business.gstNumber,
      businessRegistrationNumber: business.businessRegistrationNumber,
      yearOfEstablishment: Number(business.yearOfEstablishment) || 2020,
      yearsOfExperience: Number(business.yearsOfExperience) || 0,
      teamSize: Number(business.teamSize) || 1,
      completedProjectsCount: Number(business.completedProjectsCount) || 0,
      businessDescription: business.businessDescription,
      highestQualification: qualification.highestQualification,
      degreeName: qualification.degreeName,
      institutionName: qualification.institutionName,
      completionYear: Number(qualification.completionYear) || 2020,
      specialization: qualification.specialization,
      professionalRegistration: qualification.professionalRegistration,
      certifications: qualification.certifications,
      previousProjectsDescription: qualification.previousProjectsDescription,
      servicesOffered: selectedServices,
      specializations: selectedServices,
      portfolioProjects,
      documents,
      serviceAreas: serviceAreasState.primaryCities,
      serviceCities: serviceAreasState.primaryCities,
      servicePincodes: serviceAreasState.pincodes.split(',').map((p) => p.trim()).filter(Boolean),
      serviceRadiusKm: serviceAreasState.serviceRadiusKm,
      onSiteServiceAvailable: serviceAreasState.onSiteServiceAvailable,
      onlineConsultationAvailable: serviceAreasState.onlineConsultationAvailable,
      pricingMethod,
      minProjectBudget: Number(minBudget) || 0,
      maxProjectBudget: Number(maxBudget) || 0,
      typicalDurationWeeks: Number(typicalDurationWeeks) || 0,
      consultationFee: Number(consultationFee) || 0,
      providesMaterials,
      providesExecution,
      worksWithContractors,
      bankDetails: {
        accountHolderName: bank.accountHolderName,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        branch: bank.branch,
        accountType: bank.accountType,
        upiId: bank.upiId,
        isVerified: false,
      },
      accountStatus: 'PROFILE_INCOMPLETE',
    });
    success('Draft progress saved! You can resume anytime.');
  };

  const handleFinalSubmit = () => {
    if (!declarationAgreed) {
      error('Please accept the declaration checkbox and BuildGhar partner guidelines');
      return;
    }
    if (!personal.name.trim() || !personal.city.trim() || !personal.pincode.trim()) {
      error('Step A: Please complete personal details including name, city, and PIN code');
      setCurrentStep(1);
      return;
    }
    if (!business.businessName.trim() || !business.businessAddress.trim()) {
      error('Step B: Please complete business name and office address');
      setCurrentStep(2);
      return;
    }
    if (!qualification.institutionName.trim()) {
      error('Step C: Please provide your qualification institution name');
      setCurrentStep(3);
      return;
    }
    if (selectedServices.length === 0) {
      error('Step D: Please select at least one service offered');
      setCurrentStep(4);
      return;
    }
    if (!bank.accountHolderName.trim() || !bank.accountNumber.trim() || !bank.ifscCode.trim()) {
      error('Step H: Please provide complete bank details for escrow payouts');
      setCurrentStep(8);
      return;
    }
    if (bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber) {
      error('Step H: Bank account numbers do not match');
      setCurrentStep(8);
      return;
    }

    const cleanPh = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);

    const saved = saveInteriorDesignerAccount({
      phone: cleanPh,
      name: personal.name.trim(),
      email: personal.email.trim(),
      alternatePhone: personal.alternatePhone,
      profilePhoto: personal.profilePhoto,
      dob: personal.dob,
      gender: personal.gender,
      residentialAddress: personal.residentialAddress,
      state: personal.state,
      city: personal.city,
      pincode: personal.pincode,
      country: personal.country,

      businessName: business.businessName.trim(),
      businessType: business.businessType,
      businessRegistrationType: business.businessRegistrationType,
      businessAddress: business.businessAddress.trim(),
      officeContact: business.officeContact,
      businessEmail: business.businessEmail || personal.email,
      website: business.website,
      gstNumber: business.gstNumber,
      businessRegistrationNumber: business.businessRegistrationNumber,
      yearOfEstablishment: Number(business.yearOfEstablishment) || 2020,
      yearsOfExperience: Number(business.yearsOfExperience) || 0,
      teamSize: Number(business.teamSize) || 1,
      completedProjectsCount: Number(business.completedProjectsCount) || 0,
      businessDescription: business.businessDescription,

      highestQualification: qualification.highestQualification,
      degreeName: qualification.degreeName,
      institutionName: qualification.institutionName,
      completionYear: Number(qualification.completionYear) || 2020,
      specialization: qualification.specialization,
      professionalRegistration: qualification.professionalRegistration,
      certifications: qualification.certifications,
      previousProjectsDescription: qualification.previousProjectsDescription,

      servicesOffered: selectedServices,
      specializations: selectedServices,
      pricingMethod,
      minProjectBudget: Number(minBudget) || 0,
      maxProjectBudget: Number(maxBudget) || 0,
      typicalDurationWeeks: Number(typicalDurationWeeks) || 0,
      consultationFee: Number(consultationFee) || 0,
      providesMaterials,
      providesExecution,
      worksWithContractors,

      portfolioProjects,
      documents,

      serviceAreas: serviceAreasState.primaryCities,
      serviceCities: serviceAreasState.primaryCities,
      servicePincodes: serviceAreasState.pincodes.split(',').map((p) => p.trim()).filter(Boolean),
      serviceRadiusKm: serviceAreasState.serviceRadiusKm,
      onSiteServiceAvailable: serviceAreasState.onSiteServiceAvailable,
      onlineConsultationAvailable: serviceAreasState.onlineConsultationAvailable,

      bankDetails: {
        accountHolderName: bank.accountHolderName.trim(),
        bankName: bank.bankName.trim(),
        accountNumber: bank.accountNumber.trim(),
        ifscCode: bank.ifscCode.trim().toUpperCase(),
        branch: bank.branch.trim(),
        accountType: bank.accountType,
        upiId: bank.upiId.trim(),
        isVerified: false,
      },

      accountStatus: 'PENDING_APPROVAL',
      isVerified: false,
    });

    success(`Application ${saved.applicationId} submitted to Operations Desk for review!`);
    navigate('/interior-designer/application-status');
  };

  const stepsList = [
    { num: 1, stepLetter: 'A', label: 'A. Personal', icon: User },
    { num: 2, stepLetter: 'B', label: 'B. Business', icon: Building2 },
    { num: 3, stepLetter: 'C', label: 'C. Qualification', icon: Award },
    { num: 4, stepLetter: 'D', label: 'D. 23 Services', icon: Layers },
    { num: 5, stepLetter: 'E', label: 'E. Portfolio', icon: ImageIcon },
    { num: 6, stepLetter: 'F', label: 'F. KYC Docs', icon: FileCheck2 },
    { num: 7, stepLetter: 'G', label: 'G. Service Areas', icon: MapPin },
    { num: 8, stepLetter: 'H', label: 'H. Bank Details', icon: CreditCard },
    { num: 9, stepLetter: 'I', label: 'I. Review & Submit', icon: ShieldCheck },
  ];

  const serviceCategories = [
    'All',
    'Residential',
    'Living & Spaces',
    'Kitchen & Wardrobe',
    'Ceiling & Lighting',
    'Commercial & Hospitality',
    'Design & Technical',
    'Execution & Advisory',
  ];

  const filteredServices = MASTER_INTERIOR_SERVICES.filter((srv) => {
    const matchesCat = activeServiceCategory === 'All' || srv.category === activeServiceCategory;
    const matchesSearch =
      !serviceSearch ||
      srv.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      srv.desc.toLowerCase().includes(serviceSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cityOptions = [
    'Gurugram',
    'New Delhi',
    'Noida',
    'Greater Noida',
    'Faridabad',
    'Ghaziabad',
    'Bengaluru',
    'Mumbai',
    'Pune',
    'Hyderabad',
    'Jaipur',
    'Chandigarh',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdfa] via-white to-[#e6f8f5] text-slate-800 flex flex-col font-sans">
      {/* ---------------- STICKY TOPBAR ---------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" subtitle="Interior Designer Portal" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="text-xs font-bold text-slate-600 hover:text-navy-950 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-blue-600" />
              <span>Save Draft</span>
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

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-navy-950 text-xs font-black uppercase font-mono mb-2">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>BuildGhar Interior Designer Onboarding Wizard (Steps A through I)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Professional Practice & Credential Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete the 9 official sections below to submit your practice for BuildGhar Centralized Admin verification.
          </p>
        </div>

        {/* ---------------- STEP INDICATOR PILLS (9 Steps) ---------------- */}
        <div className="mb-8 grid grid-cols-3 sm:grid-cols-9 gap-2">
          {stepsList.map((s) => {
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02]'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-[10px]">{s.stepLetter}</span>
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

        {/* ---------------- WIZARD CARD CONTAINER ---------------- */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-100 shadow-sm relative">
          {/* ================= STEP 1: STEP A - PERSONAL INFORMATION ================= */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Step A: Personal Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Details of the principal interior designer or practice head.
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
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (Verified) <span className="text-rose-500">*</span>
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
                    Alternate Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={personal.alternatePhone}
                    onChange={(e) => setPersonal({ ...personal, alternatePhone: e.target.value })}
                    placeholder="Alternate contact"
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
                    placeholder="designer@studio.com"
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
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complete Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personal.residentialAddress}
                    onChange={(e) => setPersonal({ ...personal, residentialAddress: e.target.value })}
                    placeholder="House / Flat No., Society / Street Name"
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
                    placeholder="e.g. Gurugram"
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
                    placeholder="e.g. Haryana"
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
                    placeholder="6-digit PIN"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 2: STEP B - BUSINESS INFORMATION ================= */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Step B: Business Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Studio structure, registration classification, commercial experience, and capacity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business / Studio Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={business.businessName}
                    onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                    placeholder="e.g. Studio Luxe Interiors & Architecture"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Type <span className="text-rose-500">*</span>
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
                    Business Registration Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={business.businessRegistrationType}
                    onChange={(e) => setBusiness({ ...business, businessRegistrationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {ALL_INTERIOR_REGISTRATION_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Year of Establishment
                  </label>
                  <input
                    type="number"
                    value={business.yearOfEstablishment || ''}
                    onChange={(e) => setBusiness({ ...business, yearOfEstablishment: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="e.g. 2019"
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
                    onChange={(e) => setBusiness({ ...business, teamSize: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="e.g. 8"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business / Studio Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={business.businessAddress}
                    onChange={(e) => setBusiness({ ...business, businessAddress: e.target.value })}
                    placeholder="Office / Design Experience Center Street Address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Office Contact Number
                  </label>
                  <input
                    type="tel"
                    value={business.officeContact}
                    onChange={(e) => setBusiness({ ...business, officeContact: e.target.value })}
                    placeholder="e.g. 0124-4288111"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={business.businessEmail}
                    onChange={(e) => setBusiness({ ...business, businessEmail: e.target.value })}
                    placeholder="contact@studioluxe.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Website / Online Portfolio Link
                  </label>
                  <input
                    type="url"
                    value={business.website}
                    onChange={(e) => setBusiness({ ...business, website: e.target.value })}
                    placeholder="https://studioluxe.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GST Number (if applicable)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={business.gstNumber}
                    onChange={(e) => setBusiness({ ...business, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Registration / CIN / Udyam Number
                  </label>
                  <input
                    type="text"
                    value={business.businessRegistrationNumber}
                    onChange={(e) => setBusiness({ ...business, businessRegistrationNumber: e.target.value })}
                    placeholder="CIN / UDYAM-XX-XX-XXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Completed Projects Count <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={business.completedProjectsCount || ''}
                    onChange={(e) => setBusiness({ ...business, completedProjectsCount: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="e.g. 35"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Description & Design Philosophy <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={business.businessDescription}
                    onChange={(e) => setBusiness({ ...business, businessDescription: e.target.value })}
                    placeholder="Describe your design aesthetics, German modular hardware capabilities, civil execution strengths, and client philosophy."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 3: STEP C - QUALIFICATION AND EXPERIENCE ================= */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span>Step C: Qualification and Experience</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Design degree, academy certifications, Council / IIID registrations, and signature project track record.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Educational Qualification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={qualification.highestQualification}
                    onChange={(e) => setQualification({ ...qualification, highestQualification: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="B.Des Interior Design">B.Des Interior Design</option>
                    <option value="B.Arch (Architecture & Interiors)">B.Arch (Architecture & Interiors)</option>
                    <option value="Diploma in Interior Design">Diploma in Interior Design</option>
                    <option value="M.Des (Interior & Furniture)">M.Des (Interior & Furniture)</option>
                    <option value="Other Design Degree / Certification">Other Design Degree / Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Interior Design Course / Degree Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={qualification.degreeName}
                    onChange={(e) => setQualification({ ...qualification, degreeName: e.target.value })}
                    placeholder="e.g. Bachelor of Interior Design"
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
                    placeholder="e.g. NID, CEPT, Pearl Academy, Sushant School of Art"
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
                    onChange={(e) => setQualification({ ...qualification, completionYear: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="e.g. 2018"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Work Experience (in Years) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={qualification.workExperienceYears || ''}
                    onChange={(e) => setQualification({ ...qualification, workExperienceYears: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="e.g. 7"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specialization Focus
                  </label>
                  <input
                    type="text"
                    value={qualification.specialization}
                    onChange={(e) => setQualification({ ...qualification, specialization: e.target.value })}
                    placeholder="e.g. Contemporary Minimalist & Luxury Penthouses"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Professional Registration (IIID / COA / etc.)
                  </label>
                  <input
                    type="text"
                    value={qualification.professionalRegistration}
                    onChange={(e) => setQualification({ ...qualification, professionalRegistration: e.target.value })}
                    placeholder="e.g. IIID-MEM-2022-819"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Software & Technical Certifications
                  </label>
                  <input
                    type="text"
                    value={qualification.certifications}
                    onChange={(e) => setQualification({ ...qualification, certifications: e.target.value })}
                    placeholder="e.g. AutoCAD, SketchUp Pro, 3ds Max / V-Ray, Revit"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Summary of Past Signature Projects
                  </label>
                  <textarea
                    rows={2}
                    value={qualification.previousProjectsDescription}
                    onChange={(e) => setQualification({ ...qualification, previousProjectsDescription: e.target.value })}
                    placeholder="List notable apartment complexes, villas, or commercial properties designed in Delhi NCR or India."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 4: STEP D - SERVICES OFFERED (23 SERVICES) ================= */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span>Step D: Services Offered (23 Master Design Services)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select all service categories your practice provides to homeowners and commercial clients.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllServices}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition"
                  >
                    Select All (23)
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllServices}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition"
                  >
                    Reset
                  </button>
                  <div className="text-xs font-black px-3 py-1 bg-blue-100 text-navy-950 rounded-full font-mono">
                    {selectedServices.length} of 23 Selected
                  </div>
                </div>
              </div>

              {/* Search & Category Filter Pills */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search from 23 master interior services (e.g. modular kitchen, ceiling, 3D render)..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveServiceCategory(cat)}
                      className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                        activeServiceCategory === cat
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-blue-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 23 Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredServices.map((srv) => {
                  const isChecked = selectedServices.includes(srv.name);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.name)}
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

              {/* Pricing & Commercial Scope Configuration */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Pricing Method
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Project Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={minBudget || ''}
                    onChange={(e) => setMinBudget(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Project Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={maxBudget || ''}
                    onChange={(e) => setMaxBudget(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 5000000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={consultationFee || ''}
                    onChange={(e) => setConsultationFee(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Execution Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providesMaterials}
                    onChange={(e) => setProvidesMaterials(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Provides Raw & Finished Materials Procurement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providesExecution}
                    onChange={(e) => setProvidesExecution(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Provides Turnkey On-Site Execution</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={worksWithContractors}
                    onChange={(e) => setWorksWithContractors(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Supports Client's External Contractors</span>
                </label>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 5: STEP E - PORTFOLIO MANAGEMENT ================= */}
          {currentStep === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <span>Step E: Portfolio Management</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload completed residential, modular kitchen, and commercial transformations with 2D/3D renders.
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

              {/* Projects Grid */}
              {portfolioProjects.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                  <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No portfolio projects added yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 mb-4">
                    Adding past projects boosts your profile credibility during Admin quotation approvals.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddProjectModal(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                  >
                    Add Your First Portfolio Project
                  </button>
                </div>
              ) : (
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
                        <span className="text-emerald-600 font-bold">Verified Portfolio Entry</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                        <label className="block font-bold text-slate-700 mb-1">Project Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          placeholder="e.g. DLF Magnolias Penthouse Interior"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Project Type</label>
                          <select
                            value={newProject.category}
                            onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                          >
                            <option value="Residential Apartment">Residential Apartment</option>
                            <option value="Luxury Villa">Luxury Villa</option>
                            <option value="Duplex / Builder Floor">Duplex / Builder Floor</option>
                            <option value="Modular Kitchen & Bath">Modular Kitchen & Bath</option>
                            <option value="Corporate Office">Corporate Office</option>
                            <option value="Retail Store">Retail Store</option>
                            <option value="Restaurant / Cafe">Restaurant / Cafe</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Built-Up Area <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={newProject.builtUpArea}
                            onChange={(e) => setNewProject({ ...newProject, builtUpArea: e.target.value })}
                            placeholder="e.g. 2,800 sq.ft"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Location</label>
                          <input
                            type="text"
                            value={newProject.location}
                            onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                            placeholder="e.g. Sector 54, Gurugram"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Completion Year</label>
                          <input
                            type="text"
                            value={newProject.completionYear}
                            onChange={(e) => setNewProject({ ...newProject, completionYear: e.target.value })}
                            placeholder="2025"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
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
                          placeholder="Brief description of materials, finishes, false ceiling, and modular scope..."
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

          {/* ================= STEP 6: STEP F - KYC AND DOCUMENT UPLOAD ================= */}
          {currentStep === 6 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                  <span>Step F: KYC and Document Upload</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload statutory credentials, identity proof, registration certifications, and qualification records.
                </p>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => {
                  const isUploaded = Boolean(
                    doc.fileSize &&
                    !doc.fileSize.includes('Pending') &&
                    !doc.fileSize.includes('No document') &&
                    doc.fileUrl &&
                    doc.fileUrl !== '#'
                  );
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
                            <span className={`font-bold uppercase ${isUploaded ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {isUploaded ? 'DOCUMENT ATTACHED' : 'PENDING UPLOAD'}
                            </span>
                            {isUploaded && doc.fileSize ? (
                              <span> • {doc.fileSize}</span>
                            ) : (
                              <span className="text-slate-400 italic"> • No document attached</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => triggerFileUpload(doc.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploaded ? 'Replace Document' : 'Upload File / PDF'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ================= STEP 7: STEP G - SERVICE AREAS ================= */}
          {currentStep === 7 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Step G: Service Areas & Operational Reach</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Define your geographic coverage, operating radius from studio, and consultation modes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Operational State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceAreasState.state}
                    onChange={(e) => setServiceAreasState({ ...serviceAreasState, state: e.target.value })}
                    placeholder="e.g. Delhi NCR"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Radius (km from office): <strong className="font-mono text-blue-700">{serviceAreasState.serviceRadiusKm} km</strong>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={150}
                    step={5}
                    value={serviceAreasState.serviceRadiusKm}
                    onChange={(e) => setServiceAreasState({ ...serviceAreasState, serviceRadiusKm: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>5 km</span>
                    <span>50 km</span>
                    <span>100 km</span>
                    <span>150 km</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Operating Cities (Select all that apply) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {cityOptions.map((c) => {
                      const isSelected = serviceAreasState.primaryCities.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (serviceAreasState.primaryCities.length === 1) return;
                              setServiceAreasState({
                                ...serviceAreasState,
                                primaryCities: serviceAreasState.primaryCities.filter((x) => x !== c),
                              });
                            } else {
                              setServiceAreasState({
                                ...serviceAreasState,
                                primaryCities: [...serviceAreasState.primaryCities, c],
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Covered PIN Codes (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={serviceAreasState.pincodes}
                    onChange={(e) => setServiceAreasState({ ...serviceAreasState, pincodes: e.target.value })}
                    placeholder="e.g. 110001, 110016, 122001, 122002, 201301"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Homeowners searching within these PIN codes will see your verified design center.
                  </p>
                </div>

                <div className="sm:col-span-2 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-navy-950">On-Site Service Availability</div>
                      <div className="text-[11px] text-slate-500">Available for site visits & measurements</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serviceAreasState.onSiteServiceAvailable}
                        onChange={(e) => setServiceAreasState({ ...serviceAreasState, onSiteServiceAvailable: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-navy-950">Online Consultation Availability</div>
                      <div className="text-[11px] text-slate-500">Available for virtual 2D/3D design reviews</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serviceAreasState.onlineConsultationAvailable}
                        onChange={(e) => setServiceAreasState({ ...serviceAreasState, onlineConsultationAvailable: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 8: STEP H - BANK DETAILS ================= */}
          {currentStep === 8 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Step H: Bank & Payout Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Designated bank account for milestone escrow disbursements (10% platform commission & 1% TDS deducted).
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
                    placeholder="As printed on bank records"
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
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
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
                    placeholder="9-18 digit account number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    value={bank.confirmAccountNumber}
                    onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                    placeholder="Re-enter bank account number"
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
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={bank.branch}
                    onChange={(e) => setBank({ ...bank, branch: e.target.value })}
                    placeholder="e.g. Cyber City Branch, Gurugram"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bank.accountType}
                    onChange={(e) => setBank({ ...bank, accountType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UPI ID (Optional for fast settlements)
                  </label>
                  <input
                    type="text"
                    value={bank.upiId}
                    onChange={(e) => setBank({ ...bank, upiId: e.target.value })}
                    placeholder="studio@okhdfcbank"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Banking Security & Statutory Privacy Notice:</strong>
                  Your banking information is protected with industry-grade encryption. Account details are accessible strictly to authorized BuildGhar Finance Desk officers during milestone release and 10% commission + 1% TDS reconciliation.
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 9: STEP I - FINAL REVIEW AND SUBMISSION ================= */}
          {currentStep === 9 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Step I: Final Review and Submission</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Carefully verify all profile information across Sections A through H before dispatching to Admin.
                </p>
              </div>

              {/* Comprehensive Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Personal & Business Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-black text-navy-950 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Personal & Business Info</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div><span className="text-slate-500">Name:</span> <strong className="text-slate-900">{personal.name || 'Not provided'}</strong></div>
                  <div><span className="text-slate-500">Mobile:</span> <strong className="font-mono text-slate-900">+91 {personal.phone}</strong></div>
                  <div><span className="text-slate-500">Email:</span> <strong className="text-slate-900">{personal.email}</strong></div>
                  <div><span className="text-slate-500">Firm Name:</span> <strong className="text-slate-900">{business.businessName || 'Not provided'}</strong></div>
                  <div><span className="text-slate-500">Entity:</span> <strong className="text-slate-900">{business.businessType} ({business.businessRegistrationType})</strong></div>
                  <div><span className="text-slate-500">Location:</span> <strong className="text-slate-900">{personal.city}, {personal.state} - {personal.pincode}</strong></div>
                </div>

                {/* Qualifications & Specializations */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-black text-navy-950 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-600" />
                      <span>Qualifications & Services</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div><span className="text-slate-500">Degree:</span> <strong className="text-slate-900">{qualification.highestQualification} ({qualification.degreeName})</strong></div>
                  <div><span className="text-slate-500">Institution:</span> <strong className="text-slate-900">{qualification.institutionName || 'Not specified'}</strong></div>
                  <div><span className="text-slate-500">Experience:</span> <strong className="text-slate-900">{qualification.workExperienceYears} Years (Team of {business.teamSize})</strong></div>
                  <div><span className="text-slate-500">Services Offered:</span> <strong className="text-blue-700 font-bold">{selectedServices.length} of 23 Services</strong></div>
                  <div><span className="text-slate-500">Pricing Method:</span> <strong className="text-slate-900">{pricingMethod}</strong></div>
                </div>

                {/* Portfolio & Documents */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-black text-navy-950 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Portfolio & Documents</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div><span className="text-slate-500">Portfolio Projects:</span> <strong className="text-slate-900">{portfolioProjects.length} Projects added</strong></div>
                  <div>
                    <span className="text-slate-500">Attached Documents:</span>{' '}
                    <strong className="text-slate-900">
                      {documents.filter((d) => d.fileUrl && d.fileUrl !== '#').length} of {documents.length} Uploaded
                    </strong>
                  </div>
                  <div><span className="text-slate-500">Service Radius:</span> <strong className="text-slate-900">{serviceAreasState.serviceRadiusKm} km</strong></div>
                  <div><span className="text-slate-500">Primary Cities:</span> <strong className="text-slate-900">{serviceAreasState.primaryCities.join(', ')}</strong></div>
                </div>

                {/* Bank Account Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-black text-navy-950 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Bank & Escrow Payouts</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(8)}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div><span className="text-slate-500">Account Holder:</span> <strong className="text-slate-900">{bank.accountHolderName || 'Not specified'}</strong></div>
                  <div><span className="text-slate-500">Bank:</span> <strong className="text-slate-900">{bank.bankName}</strong></div>
                  <div>
                    <span className="text-slate-500">Account Number:</span>{' '}
                    <strong className="font-mono text-slate-900">
                      {bank.accountNumber ? `•••• •••• •••• ${bank.accountNumber.slice(-4)}` : 'Not provided'}
                    </strong>
                  </div>
                  <div><span className="text-slate-500">IFSC Code:</span> <strong className="font-mono text-slate-900">{bank.ifscCode || 'Not provided'}</strong></div>
                  <div><span className="text-slate-500">Account Type:</span> <strong className="text-slate-900">{bank.accountType} Account</strong></div>
                </div>
              </div>

              {/* Selected Services Tags */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs">
                <div className="font-bold text-navy-950">Active Services to be Displayed on BuildGhar:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedServices.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 text-[11px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Accuracy & Code of Conduct Declaration */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={declarationAgreed}
                    onChange={(e) => setDeclarationAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>
                    I hereby declare that all submitted personal details, business entity credentials, professional certifications, and past project representations are truthful and accurate. I agree to comply with the BuildGhar Professional Code of Conduct, Centralized Admin Mediation & Milestone Escrow Terms.
                  </span>
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-navy-950 flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  Our Operations Governance Desk reviews submitted applications within <strong>24 to 48 hours</strong>. You can monitor review progress on your status tracker anytime.
                </span>
              </div>
            </motion.div>
          )}

          {/* ---------------- NAVIGATION BUTTONS FOOTER ---------------- */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
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
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Continue to Step {stepsList[currentStep]?.stepLetter || currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black transition flex items-center gap-2 shadow-lg cursor-pointer"
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
