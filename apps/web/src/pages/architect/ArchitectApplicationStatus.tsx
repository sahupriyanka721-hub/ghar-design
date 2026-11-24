import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Building2,
  FileText,
  User,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  PhoneCall,
  Mail,
  Sliders,
  Briefcase,
  FileCheck2,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getArchitectByPhone,
  getArchitectAccounts,
  updateArchitectStatus,
  formatArchitectId,
  generateArchitectApplicationNumber,
  ArchitectAccount,
  ArchitectAccountStatus,
} from '../../data/architectStore.js';
import { pullFromCloud } from '../../data/cloudSync.js';

export const ArchitectApplicationStatus: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [architect, setArchitect] = useState<ArchitectAccount | null>(null);
  const [loading, setLoading] = useState(true);

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

    const cleanPhone = (rawUser?.phone || '').replace(/\D/g, '').slice(-10);
    const allArchs = getArchitectAccounts();

    const found =
      (cleanPhone && getArchitectByPhone(cleanPhone)) ||
      (cleanPhone && allArchs.find((a) => (a.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone)) ||
      (rawUser?.id && allArchs.find((a) => a.userId === rawUser.id || a.id === rawUser.id));

    if (found) {
      setArchitect(found);
    } else {
      const storedName =
        (cleanPhone && localStorage.getItem(`registered_arch_name_${cleanPhone}`)) || rawUser?.name || '';
      const storedFirm =
        (cleanPhone && localStorage.getItem(`registered_arch_firm_${cleanPhone}`)) || (rawUser as any)?.firmName || '';
      const appNum = generateArchitectApplicationNumber();
      setArchitect({
        id: appNum,
        applicationNumber: appNum,
        name: storedName,
        phone: cleanPhone || '',
        email: rawUser?.email || '',
        accountStatus: 'PENDING_APPROVAL',
        isVerified: false,
        services: [],
        serviceCities: [],
        documents: [],
        portfolioProjects: [],
        designation: '',
        experienceYears: 0,
        bio: '',
        firmName: storedFirm,
        businessType: 'Architecture Firm',
        establishmentYear: new Date().getFullYear(),
        teamSize: 1,
        architectsCount: 1,
        panNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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
    window.addEventListener('architect_store_updated', onUpdate);
    window.addEventListener('admin_global_refresh', onUpdate);
    return () => {
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('architect_store_updated', onUpdate);
      window.removeEventListener('admin_global_refresh', onUpdate);
    };
  }, [user]);

  const status = architect?.accountStatus || 'PENDING_APPROVAL';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-white to-[#edf6fd] text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" subtitle="Architect Partner Portal" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/architect"
              className="text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Architect Overview</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Status Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Primary Status Card */}

        {/* Primary Status Card */}
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-sky-100 shadow-lg relative overflow-hidden"
        >
          {/* 1. PENDING APPROVAL */}
          {status === 'PENDING_APPROVAL' && (
            <div className="space-y-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase font-mono">
                      Application Under Verification
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>ID Issued Upon Approval</span>
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Your Architecture Profile is in Review
                  </h2>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Governance Verification in Progress:</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your application is currently under review. Your official Architect ID and professional portal access will be granted only after Super Admin verifies your Council of Architecture (COA) credentials and approves your application.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Thank you for applying to the BuildGhar Architect & Civil Engineering Partner Network. Our Operations
                Governance Desk is currently verifying your Council of Architecture (COA) registration, statutory PAN,
                and portfolio projects.
              </p>

              {/* Progress Milestones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. OTP Mobile Verified</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Confirmed via +91 {architect?.phone}</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. Profile & Docs Uploaded</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{architect?.services?.length || 5} Services Configured</div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin-slow" />
                    <span>3. COA Desk Audit</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Estimated 24-48 Hours</div>
                </div>
              </div>

              {/* Notice while waiting for Admin Approval */}
              <div className="pt-2 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-extrabold text-navy-950">Access Unlocks After Super Admin Approval</div>
                    <div className="text-[11px] text-amber-800">Your architecture workspace, client RFQs, and quotation modules will activate immediately upon verification.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const latest = user?.phone ? getArchitectByPhone(user.phone) : null;
                    if (latest) {
                      setArchitect(latest);
                      setStatus(latest.accountStatus || 'PENDING_APPROVAL');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shrink-0 cursor-pointer"
                >
                  Check Verification Status
                </button>
              </div>
            </div>
          )}

          {/* 2. CHANGES REQUESTED */}
          {status === 'CHANGES_REQUESTED' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-inner">
                  <AlertTriangle className="w-8 h-8 text-sky-700" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-sky-100 text-sky-900 text-xs font-black uppercase font-mono mb-1">
                    Action Required by Architect
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Modifications Requested on Your Profile
                  </h2>
                </div>
              </div>

              {/* Admin Remarks Box */}
              <div className="p-5 rounded-2xl bg-sky-50 border-2 border-sky-300 space-y-2">
                <div className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-700" />
                  <span>Governance Desk Remarks</span>
                </div>
                <p className="text-xs sm:text-sm text-sky-900 font-medium leading-relaxed">
                  "{architect?.adminReviewRemarks || 'Please re-upload a clear scanned copy of your Council of Architecture (COA) certificate.'}"
                </p>
                <div className="text-[10px] text-sky-700 font-mono pt-1">
                  Reviewed by: {architect?.adminReviewedBy || 'Operations Desk'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/architect/profile-wizard"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Edit & Resubmit Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/architect"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  View Public Partner Guidelines
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase font-mono">
                      Verified Partner
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 text-xs font-mono font-bold border border-emerald-300">
                      Official Architect ID: {formatArchitectId(architect?.id)}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Congratulations! Your Account is Approved
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Your Council of Architecture credentials have been verified. You now have full access to incoming
                landowner RFQs across Delhi NCR and the 10 core architectural modules.
              </p>

              {/* Verified Details Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Firm Name:</span>
                  <div className="font-bold text-slate-900">{architect?.firmName}</div>
                </div>
                <div>
                  <span className="text-slate-500">COA Number:</span>
                  <div className="font-mono font-bold text-emerald-800">{architect?.coaNumber}</div>
                </div>
                <div>
                  <span className="text-slate-500">Verified Since:</span>
                  <div className="font-mono font-bold text-slate-700">Active (2026)</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  to="/professional"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black shadow-lg transition flex items-center justify-center gap-2 group"
                >
                  <span>Launch Architecture Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/professional/assigned"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  View Assigned Client RFQs
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
                Unfortunately, your application could not be verified with the submitted Council of Architecture records
                at this time.
              </p>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <strong>Feedback from Compliance:</strong> {architect?.adminReviewRemarks || 'Credentials could not be verified with COA registry.'}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/architect/profile-wizard"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-navy-950 text-white text-xs font-extrabold transition text-center"
                >
                  Re-Apply with Updated Documents
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

          {/* 5. SUSPENDED */}
          {status === 'SUSPENDED' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldAlert className="w-8 h-8 text-rose-600" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-rose-100 text-rose-900 text-xs font-black uppercase font-mono mb-1">
                    Account Suspended
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
                    Partner Privileges Temporarily Suspended
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                This architecture partner account has been temporarily restricted by the platform governance desk. New
                homeowner RFQs and quotation submissions are paused.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Notice:</strong> {architect?.adminReviewRemarks || 'Please reach out to partner governance at operations@ghardesign.in to resolve this suspension.'}
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
