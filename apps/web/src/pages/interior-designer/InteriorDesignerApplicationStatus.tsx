import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Palette,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Building2,
  RefreshCw,
  Mail,
  Sliders,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getInteriorDesignerByPhone,
  getInteriorDesignerAccounts,
  InteriorDesignerAccount,
} from '../../data/interiorDesignerStore.js';
import { pullFromCloud } from '../../data/cloudSync.js';

export const InteriorDesignerApplicationStatus: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [designer, setDesigner] = useState<InteriorDesignerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccount = () => {
    const rawUser =
      user ||
      (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
          return null;
        }
      })();

    if (rawUser?.phone) {
      const cleanPhone = rawUser.phone.replace(/\D/g, '').slice(-10);
      const found =
        getInteriorDesignerByPhone(cleanPhone) ||
        getInteriorDesignerAccounts().find(
          (a) =>
            (a.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone ||
            (rawUser.id && (a.userId === rawUser.id || a.id === rawUser.id))
        );

      if (found) {
        setDesigner(found);
      } else {
        const storedName =
          localStorage.getItem(`registered_interior_designer_name_${cleanPhone}`) ||
          rawUser.name ||
          'Interior Designer Partner';

        // Check if phone was registered
        const isReg =
          localStorage.getItem(`registered_interior_designer_phone_${cleanPhone}`) === 'true';

        if (isReg) {
          setDesigner({
            id: `id-${cleanPhone}`,
            name: storedName,
            phone: cleanPhone,
            email: rawUser.email || '',
            accountStatus: 'PENDING_APPROVAL',
            isVerified: false,
            applicationId: `BG-ID-${new Date().getFullYear()}-${cleanPhone.slice(-3)}`,
            businessName: storedName || '',
            businessType: 'Interior Design Firm',
            businessAddress: '',
            businessEmail: rawUser.email || '',
            yearsOfExperience: 0,
            teamSize: 1,
            completedProjectsCount: 0,
            businessDescription: '',
            serviceAreas: [],
            serviceCities: [],
            availableForNewProjects: true,
            specializations: [],
            preferredProjectTypes: [],
            minProjectBudget: 0,
            maxProjectBudget: 0,
            typicalDurationWeeks: 0,
            consultationFee: 0,
            pricingMethod: 'Per Square Foot',
            providesMaterials: true,
            providesExecution: true,
            worksWithContractors: true,
            highestQualification: '',
            degreeName: '',
            institutionName: '',
            completionYear: 0,
            documents: [],
            portfolioProjects: [],
            registeredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            state: '',
            city: '',
            pincode: '',
          });
        } else {
          setDesigner(null);
        }
      }
    } else {
      setDesigner(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAccount();
    pullFromCloud()
      .then(() => loadAccount())
      .catch(() => {});

    const onUpdate = () => {
      loadAccount();
    };

    window.addEventListener('storage', onUpdate);
    window.addEventListener('interior_designer_store_updated', onUpdate);
    window.addEventListener('admin_global_refresh', onUpdate);
    return () => {
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('interior_designer_store_updated', onUpdate);
      window.removeEventListener('admin_global_refresh', onUpdate);
    };
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await pullFromCloud().catch(() => {});
    loadAccount();
    setRefreshing(false);
    success('Application status refreshed from server');
  };

  const status = designer?.accountStatus || 'PENDING_APPROVAL';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!designer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0fdfa] via-white to-[#e6f8f5] text-slate-800 flex flex-col font-sans">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo size="sm" subtitle="Interior Designer Portal" />
            </Link>
          </div>
        </header>

        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
            <Palette className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-display text-navy-950">No Application Found</h2>
            <p className="text-xs text-slate-600">
              You haven't registered as an Interior Designer partner yet, or your session has expired.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/interior-designer/register"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
            >
              Register as Partner
            </Link>
            <Link
              to="/interior-designer/login"
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
            >
              Sign In with Registered Phone
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
            </button>
            <Link
              to="/interior-designer"
              className="text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Primary Status Card */}
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-blue-100 shadow-lg relative overflow-hidden"
        >
          {/* 1. PENDING APPROVAL, SUBMITTED, PENDING REVIEW, or UNDER VERIFICATION */}
          {(status === 'PENDING_APPROVAL' ||
            status === 'SUBMITTED' ||
            status === 'PENDING_REVIEW' ||
            status === 'UNDER_VERIFICATION' ||
            status === 'UNDER_REVIEW') && (
            <div className="space-y-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase font-mono mb-1">
                    {status === 'UNDER_VERIFICATION' || status === 'UNDER_REVIEW'
                      ? 'Under Verification by Admin Desk'
                      : 'Application Submitted & Queued'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Application Under Admin Verification
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Thank you for applying to BuildGhar's Interior Designer Partner Network. Our Centralized Operations
                Governance Desk is verifying your studio registration, degree qualifications, and residential portfolio.
              </p>

              {/* Progress Milestones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. Mobile OTP Verified</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Ph: +91 {designer?.phone}</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. Profile & KYC Submitted</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {(designer?.servicesOffered || designer?.specializations)?.length || 0} Services Configured
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>3. Operations Desk Audit</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Estimated 24-48 Hours</div>
                </div>
              </div>
            </div>
          )}

          {/* 2. RESUBMISSION REQUIRED (Correction Request from Admin) */}
          {status === 'RESUBMISSION_REQUIRED' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-inner">
                  <AlertTriangle className="w-8 h-8 text-purple-700" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-purple-100 text-purple-900 text-xs font-black uppercase font-mono mb-1">
                    Profile Corrections Requested
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Corrections Required on Your Application
                  </h2>
                </div>
              </div>

              {/* Admin Remarks */}
              <div className="p-5 rounded-2xl bg-purple-50 border-2 border-purple-300 space-y-2">
                <div className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Sliders className="w-4 h-4 text-purple-700" />
                  <span>Admin Governance Correction Notice</span>
                </div>
                <p className="text-xs sm:text-sm text-purple-900 font-medium leading-relaxed">
                  "{designer?.adminReviewRemarks || 'Please update your business details and make sure registration documents match before resubmission.'}"
                </p>
                <div className="text-[10px] text-purple-700 font-mono pt-1">
                  Reviewed by: {designer?.adminReviewedBy || 'Operations Governance Desk'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/interior-designer/profile-wizard"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Open Profile Wizard & Resubmit</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/interior-designer"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  View Partner Guidelines
                </Link>
              </div>
            </div>
          )}

          {/* 2. DOCUMENTS REQUIRED */}
          {status === 'DOCUMENTS_REQUIRED' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-inner">
                  <AlertTriangle className="w-8 h-8 text-sky-700" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-sky-100 text-sky-900 text-xs font-black uppercase font-mono mb-1">
                    Additional Documents Requested
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Modifications Requested on Your Profile
                  </h2>
                </div>
              </div>

              {/* Admin Remarks */}
              <div className="p-5 rounded-2xl bg-sky-50 border-2 border-sky-300 space-y-2">
                <div className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Sliders className="w-4 h-4 text-sky-700" />
                  <span>Governance Desk Remarks</span>
                </div>
                <p className="text-xs sm:text-sm text-sky-900 font-medium leading-relaxed">
                  "{designer?.adminReviewRemarks || 'Please upload a clear scanned copy of your Degree Certificate and at least 2 completed project portfolio photos with client descriptions.'}"
                </p>
                <div className="text-[10px] text-sky-700 font-mono pt-1">
                  Reviewed by: {designer?.adminReviewedBy || 'Operations Governance Desk'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/interior-designer/profile-wizard"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Edit & Resubmit Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/interior-designer"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  View Partner Guidelines
                </Link>
              </div>
            </div>
          )}

          {/* 3. APPROVED */}
          {status === 'APPROVED' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase font-mono mb-1">
                    Verified Partner
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Congratulations! Your Account is Approved
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Your interior Design Center credentials and portfolio have been verified by BuildGhar. You now have full
                access to assigned homeowner quotation briefs, 3D render approvals, and the complete 14-module partner panel.
              </p>

              {/* Card info */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Firm Name:</span>
                  <div className="font-bold text-slate-900">{designer?.businessName || designer?.name}</div>
                </div>
                <div>
                  <span className="text-slate-500">Application ID:</span>
                  <div className="font-mono font-bold text-emerald-800">{designer?.applicationId}</div>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <div className="font-mono font-bold text-slate-700">Active Partner</div>
                </div>
              </div>

              {designer?.adminReviewRemarks && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <strong>Admin Remarks:</strong> {designer.adminReviewRemarks}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  to="/interior-designer/dashboard"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white text-xs font-black shadow-lg transition flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Launch Interior Designer Panel</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/interior-designer/quotations"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  View Assigned RFQs
                </Link>
              </div>
            </div>
          )}

          {/* 4. REJECTED */}
          {status === 'REJECTED' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-inner">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-rose-100 text-rose-900 text-xs font-black uppercase font-mono mb-1">
                    Application Unsuccessful
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Application Review Result
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Unfortunately, your application could not be verified with the submitted portfolio or qualifications at
                this time.
              </p>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <strong>Feedback from Compliance:</strong> {designer?.adminReviewRemarks || 'Credentials could not be verified.'}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/interior-designer/profile-wizard"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-navy-950 text-white text-xs font-extrabold transition text-center"
                >
                  Re-Apply with Updated Portfolio
                </Link>
                <Link
                  to="/contact"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  Contact Support Desk
                </Link>
              </div>
            </div>
          )}

          {/* 5. SUSPENDED or DEACTIVATED */}
          {(status === 'SUSPENDED' || status === 'DEACTIVATED') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldAlert className="w-8 h-8 text-rose-600" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-rose-100 text-rose-900 text-xs font-black uppercase font-mono mb-1">
                    {status === 'DEACTIVATED' ? 'Account Deactivated' : 'Account Suspended'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Partner Privileges Temporarily Suspended
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                This interior designer account has been restricted by the platform governance desk. New homeowner
                quotation assignments and active project actions are paused.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Notice:</strong> {designer?.adminReviewRemarks || 'Please reach out to partner governance at operations@ghardesign.in to resolve this suspension.'}
              </div>

              <div>
                <a
                  href="mailto:operations@ghardesign.in"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-navy-950 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact Governance Desk</span>
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};
