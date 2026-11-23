import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardHat,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Award,
  Plus,
  Eye,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  FileText,
  Briefcase,
  Layers,
  Calendar,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  getPlatformContractors,
  savePlatformContractor,
  updateContractorKYCStatus,
  PlatformContractor,
  recordPlatformAuditLog,
} from '../../data/adminStore.js';
import { getRegisteredArchitects } from '../../data/architectStore.js';
import { getRegisteredInteriorDesigners } from '../../data/interiorDesignerStore.js';
import { formatDate } from '../../lib/utils.js';

export const AdminContractors: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'CONTRACTORS' | 'CENTRAL_VERIFICATION'>('CONTRACTORS');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Contractor details modal
  const [selectedContractor, setSelectedContractor] = useState<PlatformContractor | null>(null);

  // Add Contractor modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [contractorStep, setContractorStep] = useState<number>(1);
  const [name, setName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Gurugram');
  const [state, setState] = useState('Haryana');
  const [experienceYears, setExperienceYears] = useState(10);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([
    'Civil Construction',
    'Foundation & RMC',
  ]);

  const contractors = useMemo(() => getPlatformContractors(), [refreshKey]);
  const architects = useMemo(() => getRegisteredArchitects(), [refreshKey]);
  const designers = useMemo(() => getRegisteredInteriorDesigners(), [refreshKey]);

  const filteredContractors = useMemo(() => {
    return contractors.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.firmName.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);

      if (!matchSearch) return false;
      if (filterStatus === 'ALL') return true;
      return c.kycStatus === filterStatus;
    });
  }, [contractors, search, filterStatus]);

  // Centralized Verification queue across all professionals
  const verificationQueue = useMemo(() => {
    const list: any[] = [];

    // Contractors
    contractors.forEach((c) => {
      list.push({
        id: c.id,
        type: 'CONTRACTOR',
        name: c.name,
        firmName: c.firmName,
        phone: c.phone,
        email: c.email,
        city: c.city,
        status: c.kycStatus,
        license: c.licenseNumber || 'Under Submission',
        createdAt: c.createdAt,
      });
    });

    // Architects
    architects.forEach((a) => {
      list.push({
        id: a.id,
        type: 'ARCHITECT',
        name: a.name,
        firmName: a.firmName,
        phone: a.phone || '+91 9800000000',
        email: a.email || '',
        city: a.city || 'Delhi NCR',
        status: a.accountStatus || 'APPROVED',
        license: a.coaNumber || 'COA Verified',
        createdAt: a.establishmentYear ? `${a.establishmentYear}-01-01` : new Date().toISOString(),
      });
    });

    // Interior Designers
    designers.forEach((d) => {
      list.push({
        id: d.id,
        type: 'INTERIOR_DESIGNER',
        name: d.name,
        firmName: d.businessName || '',
        phone: d.phone || '',
        email: d.email || '',
        city: d.city || '',
        status: d.accountStatus || 'APPROVED',
        license: d.highestQualification || '',
        createdAt: d.businessRegistrationDate || new Date().toISOString(),
      });
    });

    return list;
  }, [contractors, architects, designers]);

  const handleApproveContractor = (contractorId: string, firm: string) => {
    updateContractorKYCStatus(contractorId, 'VERIFIED');
    recordPlatformAuditLog({
      action: 'VERIFY_CONTRACTOR',
      module: 'CONTRACTOR_MANAGEMENT',
      entity: firm,
      previousValue: 'Status: PENDING',
      newValue: 'Status: VERIFIED',
    });
    success(`Contractor ${firm} KYC verified & approved for site assignments!`);
    setSelectedContractor(null);
    setRefreshKey((k) => k + 1);
  };

  const handleRejectContractor = (contractorId: string, firm: string) => {
    updateContractorKYCStatus(contractorId, 'REJECTED');
    recordPlatformAuditLog({
      action: 'REJECT_CONTRACTOR',
      module: 'CONTRACTOR_MANAGEMENT',
      entity: firm,
      previousValue: 'Status: PENDING',
      newValue: 'Status: REJECTED',
    });
    error(`Contractor ${firm} marked rejected.`);
    setSelectedContractor(null);
    setRefreshKey((k) => k + 1);
  };

  const handleCreateContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !firmName.trim() || !phone.trim()) {
      error('Please provide contractor name, firm name and contact number');
      return;
    }

    savePlatformContractor({
      name: name.trim(),
      firmName: firmName.trim(),
      phone: phone.trim().startsWith('+91') ? phone.trim() : `+91 ${phone.trim()}`,
      email: email.trim(),
      city: city.trim(),
      state: state.trim(),
      experienceYears,
      licenseNumber: licenseNumber.trim(),
      gstNumber: gstNumber.trim(),
      specializations: selectedSpecializations,
      kycStatus: 'VERIFIED',
    });

    success(`Contractor ${firmName} registered and verified successfully!`);
    setShowAddModal(false);
    setName('');
    setFirmName('');
    setPhone('');
    setRefreshKey((k) => k + 1);
  };

  const specializationsList = [
    'Civil Construction',
    'Foundation & RMC',
    'Structural Steel & Fabrication',
    'Masonry & Plastering',
    'Waterproofing',
    'Tile & Marble Laying',
    'MEP Electrical & Plumbing',
    'Turnkey Construction',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
              <HardHat className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Contractor Management & Professional Verification
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Civil contractors, turnkey builders, trade specialists and centralized KYC verification desk.
          </p>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('CONTRACTORS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'CONTRACTORS'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Contractors Directory ({contractors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CENTRAL_VERIFICATION')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'CENTRAL_VERIFICATION'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Central Verification Desk ({verificationQueue.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'CONTRACTORS' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All KYC Statuses</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="PENDING">Pending KYC</option>
                <option value="REJECTED">Rejected</option>
              </select>
            )}

            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contractor, city, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: CONTRACTORS TABLE */}
        {activeTab === 'CONTRACTORS' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Contractor / Firm</th>
                  <th className="py-3 px-3">Location & Exp</th>
                  <th className="py-3 px-3">Specializations</th>
                  <th className="py-3 px-3 text-center">Track Record</th>
                  <th className="py-3 px-3 text-center">KYC Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContractors.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setSelectedContractor(c)}
                        className="cursor-pointer group"
                        title="Click to view dossier"
                      >
                        <strong className="text-slate-900 group-hover:text-blue-600 transition-colors block text-xs">
                          {c.firmName}
                        </strong>
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-700">
                          {c.name} · {c.phone}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-800 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {c.city}, {c.state}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{c.experienceYears} Years in Trade</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.specializations.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {c.specializations.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{c.specializations.length - 2} more</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <strong className="text-navy-950 font-mono text-xs block">{c.completedProjectsCount} Completed</strong>
                      <div className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{c.rating}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.kycStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : c.kycStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {c.kycStatus === 'VERIFIED' && <CheckCircle2 className="w-3 h-3" />}
                        {c.kycStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                        {c.kycStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        <span>{c.kycStatus}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedContractor(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Dossier</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CENTRALIZED PROFESSIONAL VERIFICATION */}
        {activeTab === 'CENTRAL_VERIFICATION' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Professional / Firm</th>
                  <th className="py-3 px-3">Role Type</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 font-mono">License / Reg Number</th>
                  <th className="py-3 px-3 text-center">KYC Status</th>
                  <th className="py-3 px-4 text-right">Quick Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verificationQueue.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{item.firmName}</strong>
                      <span className="text-[11px] text-slate-500">
                        {item.name} · {item.phone}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700">{item.city}</td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{item.license}</td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'VERIFIED' || item.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="text-slate-400 font-mono text-[11px]">Audit Protected</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CONTRACTOR AUDIT DETAILS */}
      <AnimatePresence>
        {selectedContractor && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedContractor(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Contractors Directory</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <HardHat className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {selectedContractor.firmName}
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40">
                        {selectedContractor.verificationStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Lead: {selectedContractor.leadContractorName} • {selectedContractor.operatingCity} • {selectedContractor.phone}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => setSelectedContractor(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">OWNER / PROPRIETOR</span>
                    <strong className="text-slate-900">{selectedContractor.name}</strong>
                    <p className="text-slate-500 text-[11px]">{selectedContractor.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">OPERATIONAL HQ</span>
                    <strong className="text-slate-900">
                      {selectedContractor.city}, {selectedContractor.state}
                    </strong>
                    <p className="text-slate-500 text-[11px]">{selectedContractor.experienceYears} Years Experience</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">LICENSES & TAX COMPLIANCE</span>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Contractor License:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedContractor.licenseNumber || 'Not Specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">GST Registration:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedContractor.gstNumber || 'Not Specified'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-slate-700 font-bold block">Certified Civil Specializations</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedContractor.specializations || []).map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setSelectedContractor(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  {selectedContractor.kycStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleApproveContractor(selectedContractor.id, selectedContractor.firmName)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve KYC</span>
                    </button>
                  )}
                  {selectedContractor.kycStatus !== 'REJECTED' && (
                    <button
                      onClick={() => handleRejectContractor(selectedContractor.id, selectedContractor.firmName)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REGISTER NEW CONTRACTOR (Stepper Wizard) */}
      <AnimatePresence>
        {showAddModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setContractorStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <HardHat className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Register New Contractor Firm
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {contractorStep} of 4 • Certified Civil Contractor Onboarding
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setContractorStep(1);
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
                  { step: 1, title: 'Firm Identity', icon: Building },
                  { step: 2, title: 'Location & Exp', icon: MapPin },
                  { step: 3, title: 'Licenses & Scope', icon: ShieldCheck },
                  { step: 4, title: 'Review & Onboard', icon: CheckCircle2 },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < contractorStep) setContractorStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          contractorStep === item.step
                            ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100'
                            : contractorStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {contractorStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          contractorStep === item.step
                            ? 'text-amber-900'
                            : contractorStep > item.step
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
                          contractorStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateContractor}>
                {/* STEP 1: FIRM IDENTITY */}
                {contractorStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Firm Name & Managing Contractor Identity
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Register contracting company legal name and primary civil engineer / director contact.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-amber-600" />
                          <span>Contracting Firm / Business Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={firmName}
                          onChange={(e) => setFirmName(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-amber-600" />
                          <span>Managing Contractor / Lead Engineer</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-amber-600" />
                          <span>Primary Contact Mobile</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-amber-600" />
                          <span>Official Email Address</span>
                        </label>
                        <input
                          type="email"
                          placeholder=""
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: LOCATION & EXPERIENCE */}
                {contractorStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Operational Territory & Construction Track Record
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select operational city, state, and years of civil construction execution experience.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Operating City <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">State / Union Territory <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Experience (Years) <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(Number(e.target.value))}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: LICENSES & SPECIALIZATIONS */}
                {contractorStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Statutory Licensing & Specialized Civil Trades
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter contractor municipal / PWD registration and select civil execution capabilities.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">
                          License / Registration Number
                        </label>
                        <input
                          type="text"
                          placeholder=""
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">
                          GST Number (GSTIN)
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          placeholder=""
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="font-bold text-slate-800 text-sm block">
                        Select Specialized Execution Capabilities
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          'Civil Construction',
                          'Foundation & RMC',
                          'Structure & RCC',
                          'Masonry & Plaster',
                          'Waterproofing',
                          'Electrical & Plumbing (MEP)',
                          'Flooring & Tiling',
                          'Turnkey House Building',
                        ].map((spec) => {
                          const checked = selectedSpecializations.includes(spec);
                          return (
                            <label
                              key={spec}
                              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                                checked
                                  ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSpecializations([...selectedSpecializations, spec]);
                                  } else {
                                    setSelectedSpecializations(
                                      selectedSpecializations.filter((s) => s !== spec)
                                    );
                                  }
                                }}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span>{spec}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & ONBOARD */}
                {contractorStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <span>Step 4 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Compliance Summary & Final Onboarding
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Confirm contractor registration. This contractor will be immediately available in project milestone allocation.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Firm Legal Name</span>
                        <p className="text-base font-bold text-navy-950 mt-0.5">{firmName || 'Not Entered'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Managing Contractor</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{name || 'Not Entered'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Contact Info</span>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">+91 {phone} {email && `• ${email}`}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Jurisdiction & Track Record</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{city}, {state} • {experienceYears} Years Civil Exp</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Statutory IDs</span>
                        <p className="text-xs font-mono text-slate-700 mt-0.5">Lic: {licenseNumber || 'N/A'} • GST: {gstNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Verified Trades ({selectedSpecializations.length})</span>
                        <p className="text-xs font-semibold text-amber-900 mt-0.5">{selectedSpecializations.join(', ') || 'General Civil'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {contractorStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setContractorStep(contractorStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {contractorStep} of 4
                  </div>

                  {contractorStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (contractorStep === 1) {
                          if (!firmName.trim() || !name.trim()) {
                            error('Please enter Firm Name and Contractor Name');
                            return;
                          }
                          const clean = phone.replace(/\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        }
                        setContractorStep(contractorStep + 1);
                      }}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {contractorStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Register Contractor</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};
