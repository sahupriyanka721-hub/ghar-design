import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, compressAvatarImage } from '../../lib/utils.js';
import {
  ShieldCheck,
  Building2,
  Layers,
  Award,
  FileCheck2,
  MapPin,
  ExternalLink,
  Edit3,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Plus,
  Briefcase,
  Globe,
  Camera,
  Trash2,
} from 'lucide-react';
import {
  getProfessionalByPhone,
  saveProfessionalAccount,
  ALL_PROFESSIONAL_SERVICES,
  ProfessionalAccount,
} from '../../data/professionalStore.js';
import {
  getArchitectByPhone,
  saveArchitectAccount,
  formatArchitectId,
  ArchitectAccount,
  ALL_ARCHITECTURAL_SERVICES,
} from '../../data/architectStore.js';

export const ProfessionalProfile: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [professional, setProfessional] = useState<ProfessionalAccount | null>(null);
  const [architect, setArchitect] = useState<ArchitectAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'BUSINESS' | 'SERVICES' | 'PORTFOLIO' | 'DOCUMENTS' | 'AREAS'>('PERSONAL');

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // New Portfolio Project Modal
  const [showAddProject, setShowAddProject] = useState(false);
  const [projName, setProjName] = useState('');
  const [projCategory, setProjCategory] = useState('Luxury Villa 3D');
  const [projLoc, setProjLoc] = useState('Noida Sector 150');
  const [projYear, setProjYear] = useState(2025);
  const [projDesc, setProjDesc] = useState('');

  const loadProfile = () => {
    if (user?.phone) {
      const clean = user.phone.replace(/\D/g, '').slice(-10);
      const foundPro = getProfessionalByPhone(clean);
      setProfessional(foundPro || null);

      const foundArch = getArchitectByPhone(clean);
      setArchitect(foundArch || null);
      return;
    }
    setProfessional(null);
    setArchitect(null);
  };

  useEffect(() => {
    loadProfile();

    const handleSync = () => loadProfile();
    window.addEventListener('storage', handleSync);
    window.addEventListener('architect_store_updated', handleSync);
    window.addEventListener('user_profile_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('architect_store_updated', handleSync);
      window.removeEventListener('user_profile_updated', handleSync);
    };
  }, [user]);

  const cleanPhone = (user?.phone || architect?.phone || '').replace(/\D/g, '').slice(-10);
  const storedPhoto = cleanPhone ? (() => {
    try {
      return localStorage.getItem(`arch_photo_${cleanPhone}`);
    } catch {
      return null;
    }
  })() : null;

  const isArchitect = Boolean(architect);
  const avatarUrl =
    architect?.profilePhoto ||
    professional?.personal?.profilePhoto ||
    (user as any)?.avatar ||
    (user as any)?.profilePhoto ||
    storedPhoto ||
    null;

  const firmTitle =
    architect?.firmName ||
    professional?.business?.firmName ||
    user?.name ||
    'Professional Practice';

  const initials = firmTitle.slice(0, 2).toUpperCase();
  const fullName = architect?.name || professional?.personal?.fullName || user?.name || 'Professional Partner';
  const designation =
    architect?.designation ||
    professional?.personal?.designation ||
    (isArchitect ? 'Principal Architect' : 'Principal Engineer');
  const phoneDisplay = user?.phone
    ? (user.phone.startsWith('+91') ? user.phone : `+91 ${cleanPhone}`)
    : (architect?.phone ? `+91 ${cleanPhone}` : '');
  const cityDisplay = architect?.city || professional?.personal?.city || '';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error('Profile photo must be less than 10MB');
      return;
    }

    try {
      const dataUrl = await compressAvatarImage(file);

      // 1. Save to phone key
      if (cleanPhone) {
        try {
          localStorage.setItem(`arch_photo_${cleanPhone}`, dataUrl);
        } catch {}
      }

      // 2. Update Architect record if architect
      if (architect) {
        const updatedArch = saveArchitectAccount({
          ...architect,
          profilePhoto: dataUrl,
        });
        setArchitect(updatedArch);
      }

      // 3. Update Professional record if professional
      if (professional) {
        const updatedPro: ProfessionalAccount = {
          ...professional,
          personal: {
            ...professional.personal,
            profilePhoto: dataUrl,
          },
        };
        saveProfessionalAccount(updatedPro);
        setProfessional(updatedPro);
      }

      // 4. Update session user
      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          parsed.avatar = dataUrl;
          parsed.profilePhoto = dataUrl;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch {}

      // 5. Broadcast updates to navbar & all tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: { profilePhoto: dataUrl } }));
        window.dispatchEvent(new CustomEvent('user_profile_updated', { detail: { avatar: dataUrl } }));
      }

      success(`Profile photo updated successfully!`);
    } catch (err: any) {
      error(err.message || 'Failed to update profile photo');
    }
  };

  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    const newPortfolioItem = {
      id: `port-${Date.now()}`,
      title: projName.trim(),
      projectName: projName.trim(),
      category: projCategory,
      location: projLoc,
      builtUpArea: '3,200 sq.ft',
      completionYear: String(projYear),
      description: projDesc || 'Modern luxury architectural planning, elevations, and interior layout.',
      imageUrl: '/images/portfolio/sample1.jpg',
      imageUrls: ['/images/portfolio/sample1.jpg'],
    };

    if (architect) {
      const updatedArch = saveArchitectAccount({
        ...architect,
        portfolioProjects: [newPortfolioItem, ...(architect.portfolioProjects || [])],
      });
      setArchitect(updatedArch);
    }

    if (professional) {
      const updated: ProfessionalAccount = {
        ...professional,
        portfolio: [newPortfolioItem as any, ...(professional.portfolio || [])],
      };
      saveProfessionalAccount(updated);
      setProfessional(updated);
    }

    setShowAddProject(false);
    setProjName('');
    setProjDesc('');
    success('New project added to portfolio!');
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Hero Card */}
      <div className="bg-white rounded-3xl border border-sky-200/90 shadow-2xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Clickable Profile Photo with Edit Camera Overlay */}
            <div className="relative group shrink-0">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={firmTitle}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-300 shadow-md shadow-sky-600/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-sky-600/20 font-display">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer shadow-md"
                title="Upload or change profile photo"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-0.5">Change</span>
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-display text-navy-950">{firmTitle}</h1>
                <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                  isArchitect
                    ? 'text-blue-900 bg-blue-50 border-blue-200'
                    : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${isArchitect ? 'text-blue-600' : 'text-emerald-600'}`} />
                  <span>
                    {isArchitect
                      ? (architect?.id && (architect.accountStatus === 'APPROVED' || architect.isVerified)
                          ? `COA Verified ([${formatArchitectId(architect.id)}])`
                          : 'COA Registered Architect')
                      : 'IEI Verified'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {fullName} {designation ? `• ${designation}` : ''} {architect?.businessType || professional?.business?.businessType ? `• ${architect?.businessType || professional?.business?.businessType}` : ''}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 flex-wrap">
                {phoneDisplay && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {phoneDisplay}
                  </span>
                )}
                {cityDisplay && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {cityDisplay}
                  </span>
                )}
                {architect?.coaNumber && (
                  <span className="flex items-center gap-1 font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[10px]">
                    COA: {architect.coaNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start flex-wrap">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Camera className="w-4 h-4 text-sky-600" />
              <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            <Link
              to={isArchitect ? "/architect/profile-wizard" : "/professional/profile-wizard"}
              className="px-4 py-2 bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4 text-sky-600" />
              <span>Edit Full Profile (Wizard)</span>
            </Link>
          </div>
        </div>

        {/* 6 Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 gap-4 text-xs font-bold pt-4 scrollbar-none">
          <button
            onClick={() => setActiveTab('PERSONAL')}
            className={`pb-3 border-b-2 transition shrink-0 ${
              activeTab === 'PERSONAL' ? 'border-sky-600 text-sky-800' : 'border-transparent text-slate-500'
            }`}
          >
            Personal Details
          </button>
          <button
            onClick={() => setActiveTab('BUSINESS')}
            className={`pb-3 border-b-2 transition shrink-0 ${
              activeTab === 'BUSINESS' ? 'border-sky-600 text-sky-800' : 'border-transparent text-slate-500'
            }`}
          >
            Business & Firm
          </button>
          <button
            onClick={() => setActiveTab('SERVICES')}
            className={`pb-3 border-b-2 transition shrink-0 ${
              activeTab === 'SERVICES' ? 'border-sky-600 text-sky-800' : 'border-transparent text-slate-500'
            }`}
          >
            Services Offered ({architect?.services?.length || professional?.services?.length || 21})
          </button>
          <button
            onClick={() => setActiveTab('PORTFOLIO')}
            className={`pb-3 border-b-2 transition shrink-0 ${
              activeTab === 'PORTFOLIO' ? 'border-sky-600 text-sky-800' : 'border-transparent text-slate-500'
            }`}
          >
            Portfolio Projects ({architect?.portfolioProjects?.length || professional?.portfolio?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`pb-3 border-b-2 transition shrink-0 ${
              activeTab === 'DOCUMENTS' ? 'border-sky-600 text-sky-800' : 'border-transparent text-slate-500'
            }`}
          >
            Documents & KYC ({architect?.documents?.length || professional?.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('AREAS')}
            className={`pb-3 border-b-2 transition shrink-0 ${
              activeTab === 'AREAS' ? 'border-sky-600 text-sky-800' : 'border-transparent text-slate-500'
            }`}
          >
            Service Areas ({architect?.serviceCities?.length || professional?.business?.serviceCities?.length || 6})
          </button>
        </div>

        {/* Tab 1: Personal Details */}
        {activeTab === 'PERSONAL' && (
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Full Name</span>
              <span className="font-bold text-slate-800">{fullName}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Designation</span>
              <span className="font-bold text-slate-800">{designation}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Experience</span>
              <span className="font-bold text-slate-800">
                {architect?.experienceYears || professional?.personal?.experienceYears || 8} Years in Practice
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Professional Bio</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {architect?.bio ||
                  professional?.personal?.bio ||
                  'Specializing in modern contemporary residential villas, luxury floor layouts, high-accuracy BOQ estimation, and IS 456 compliant structural drafting.'}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">
                {isArchitect ? 'Council of Architecture (COA) Status' : 'IEI Registration Status'}
              </span>
              <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active & Verified
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Business & Firm Details */}
        {activeTab === 'BUSINESS' && (
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Firm Name</span>
              <span className="font-bold text-slate-800">{architect?.firmName || professional?.business?.firmName || firmTitle}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Business Entity</span>
              <span className="font-bold text-slate-800">{architect?.businessType || professional?.business?.businessType || 'Architecture Firm'}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Establishment Year</span>
              <span className="font-bold text-slate-800">{architect?.establishmentYear || professional?.business?.establishmentYear || 2018}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Team Strength</span>
              <span className="font-bold text-slate-800">
                {architect?.teamSize || professional?.business?.teamSize || 6} Total ({(architect as any)?.architectsCount || professional?.business?.professionalsCount || 3} Architects/Engineers)
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">PAN / Tax ID</span>
              <span className="font-mono font-bold text-slate-800">{architect?.panNumber || professional?.business?.panNumber || 'ABCDE1234F'}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">GSTIN (Optional)</span>
              <span className="font-mono font-bold text-slate-800">{architect?.gstin || professional?.business?.gstin || '07AAAAA0000A1Z5'}</span>
            </div>
            {architect?.coaNumber && (
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">COA Registration Number</span>
                <span className="font-mono font-bold text-blue-800">{architect.coaNumber}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Services Offered */}
        {activeTab === 'SERVICES' && (
          <div className="pt-6 space-y-4">
            <div className="text-xs text-slate-500">
              Active architectural and civil engineering services provided by your practice on the platform:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {(architect?.services && architect.services.length > 0
                ? architect.services.map((s, idx) => ({
                    name: typeof s === 'string' ? s : (s as any)?.name || 'Service',
                    category: (typeof s === 'object' && (s as any)?.category) || 'Architectural Service',
                    desc: (typeof s === 'object' && (s as any)?.desc) || 'Comprehensive drawing package, site coordination, and regulatory compliance.',
                  }))
                : ALL_PROFESSIONAL_SERVICES
              ).map((srv, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{srv.name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-sky-50 text-sky-800 border border-sky-200">
                      {srv.category}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{srv.desc}</p>
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active in Catalog
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Portfolio Projects */}
        {activeTab === 'PORTFOLIO' && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Past projects visible on your Professional Profile</span>
              <button
                onClick={() => setShowAddProject(true)}
                className="px-3 py-1.5 bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-sky-600" />
                <span>Add Portfolio Project</span>
              </button>
            </div>

            {(!architect?.portfolioProjects || architect.portfolioProjects.length === 0) &&
            (!professional?.portfolio || professional.portfolio.length === 0) ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                <p>No portfolio projects added yet. Click above to showcase your completed designs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {((architect?.portfolioProjects && architect.portfolioProjects.length > 0)
                  ? architect.portfolioProjects.map((p) => ({
                      id: p.id,
                      projectName: p.title,
                      completionYear: p.completionYear,
                      category: p.category,
                      location: p.location,
                      description: p.description,
                      imageUrl: p.imageUrl,
                    }))
                  : professional?.portfolio || []
                ).map((p: any) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{p.projectName || p.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.completionYear}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{p.category} • {p.location}</div>
                    <p className="text-slate-600">{p.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Documents & Verification */}
        {activeTab === 'DOCUMENTS' && (
          <div className="pt-6 space-y-4">
            <div className="text-xs text-slate-500">
              Accreditation files inspected by Build Ghar Admin Verification Desk:
            </div>

            {(!architect?.documents || architect.documents.length === 0) &&
            (!professional?.documents || professional.documents.length === 0) ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                Documents uploaded during registration are stored securely in cloud custody.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {((architect?.documents && architect.documents.length > 0)
                  ? architect.documents.map((d) => ({
                      id: d.id,
                      documentName: d.title,
                      documentType: d.documentType,
                      fileSize: d.fileSize || 'PDF Document',
                      verificationStatus: d.status,
                    }))
                  : professional?.documents || []
                ).map((d: any) => (
                  <div key={d.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{d.documentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.documentType} • {d.fileSize}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                      {d.verificationStatus || 'VERIFIED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Service Areas */}
        {activeTab === 'AREAS' && (
          <div className="pt-6 space-y-3 text-xs">
            <div className="text-slate-500">Operating geographic locations for site visits and offline inspections:</div>
            <div className="flex flex-wrap gap-2">
              {(architect?.serviceCities && architect.serviceCities.length > 0
                ? architect.serviceCities
                : professional?.business?.serviceCities || ['Delhi NCR', 'Noida', 'Greater Noida', 'Gurugram', 'Faridabad', 'Ghaziabad']
              ).map((c, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-900 font-bold border border-sky-200 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>{c}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Portfolio Project</h3>
              <button onClick={() => setShowAddProject(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPortfolio} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Modern Minimalist Villa"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <input
                  type="text"
                  value={projCategory}
                  onChange={(e) => setProjCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location</label>
                  <input
                    type="text"
                    value={projLoc}
                    onChange={(e) => setProjLoc(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Year</label>
                  <input
                    type="number"
                    value={projYear}
                    onChange={(e) => setProjYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Highlight Vastu orientation, materials used, structural highlights..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
