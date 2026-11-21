import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  HardHat,
  Compass,
  Palette,
  Eye,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  DollarSign,
  Layers,
  MapPin,
  TrendingUp,
  FileText,
  Camera,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getExecutionProjects,
  saveExecutionProject,
  createDefaultExecutionStages,
  createDefaultPaymentMilestones,
  ExecutionProject,
} from '../../data/projectExecutionStore.js';
import { registerNewCustomer } from '../../data/customerStore.js';
import { pushToCloud } from '../../data/cloudSync.js';
import { getRegisteredArchitects } from '../../data/architectStore.js';
import { getRegisteredInteriorDesigners } from '../../data/interiorDesignerStore.js';
import { getPlatformContractors, recordPlatformAuditLog } from '../../data/adminStore.js';

export const AdminProjects: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'AWAITING_TEAM' | 'COMPLETED' | 'DELAYED'>('ALL');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected project for details drawer
  const [selectedProject, setSelectedProject] = useState<ExecutionProject | null>(null);

  // Assign Team modal
  const [teamModalProject, setTeamModalProject] = useState<ExecutionProject | null>(null);
  const [assignedArchitectId, setAssignedArchitectId] = useState('');
  const [assignedDesignerId, setAssignedDesignerId] = useState('');
  const [assignedContractorId, setAssignedContractorId] = useState('');

  // Create Project modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectStep, setProjectStep] = useState<number>(1);
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [budgetRupees, setBudgetRupees] = useState<number | ''>('');
  const [projectType, setProjectType] = useState<'VILLA' | 'FLOOR' | 'RENOVATION' | 'INTERIOR'>('VILLA');

  const projects = useMemo(() => getExecutionProjects(), [refreshKey]);
  const architects = useMemo(() => getRegisteredArchitects(), [refreshKey]);
  const designers = useMemo(() => getRegisteredInteriorDesigners(), [refreshKey]);
  const contractors = useMemo(() => getPlatformContractors(), [refreshKey]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (p.siteLocation?.city && p.siteLocation.city.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (activeTab === 'ACTIVE') return p.status === 'IN_PROGRESS' || p.status === 'ACTIVE';
      if (activeTab === 'AWAITING_TEAM') return !p.contractorId || !p.architectId;
      if (activeTab === 'COMPLETED') return p.status === 'COMPLETED';
      if (activeTab === 'DELAYED') return p.status === 'DELAYED';

      return true;
    });
  }, [projects, search, activeTab]);

  const handleOpenTeamModal = (prj: ExecutionProject) => {
    setTeamModalProject(prj);
    setAssignedArchitectId(prj.architectId || '');
    setAssignedDesignerId(prj.interiorDesignerId || '');
    setAssignedContractorId(prj.contractorId || '');
  };

  const handleSaveTeamAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamModalProject) return;

    const arch = architects.find((a) => a.id === assignedArchitectId);
    const des = designers.find((d) => d.id === assignedDesignerId);
    const cnt = contractors.find((c) => c.id === assignedContractorId);

    const updatedPrj: ExecutionProject = {
      ...teamModalProject,
      architectId: assignedArchitectId || undefined,
      architectName: arch?.personal?.fullName || arch?.business?.firmName || teamModalProject.architectName,
      interiorDesignerId: assignedDesignerId || undefined,
      interiorDesignerName: des?.personal?.fullName || des?.business?.studioName || teamModalProject.interiorDesignerName,
      contractorId: assignedContractorId || undefined,
      contractorName: cnt?.firmName || cnt?.name || teamModalProject.contractorName,
      status: 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(updatedPrj);
    recordPlatformAuditLog({
      action: 'ASSIGN_PROJECT_TEAM',
      module: 'PROJECT_MANAGEMENT',
      entity: `Project #${updatedPrj.code} (${updatedPrj.name})`,
      newValue: `Architect: ${updatedPrj.architectName}, Contractor: ${updatedPrj.contractorName}`,
    });

    success(`Project team assigned to ${updatedPrj.name}! Work status set to IN_PROGRESS.`);
    setTeamModalProject(null);
    setRefreshKey((k) => k + 1);
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !customerName.trim() || !customerPhone.trim()) {
      error('Please provide project name and customer details');
      return;
    }

    const totalContractPaise = budgetRupees * 100;
    const stages = createDefaultExecutionStages();
    const paymentMilestones = createDefaultPaymentMilestones(totalContractPaise);
    const seq = Math.floor(100 + Math.random() * 900);

    const newPrj: ExecutionProject = {
      id: `PRJ-2026-${seq}`,
      requestCode: `GHR-REQ-2026-${seq}`,
      quotationId: `quote-${Date.now()}`,
      quotationCode: `QT-2026-${seq}`,
      bookingCode: `GHR-BK-2026-${seq}`,
      workOrderNumber: `WO-2026-${seq}`,
      name: projectName.trim(),
      customerId: `usr-cust-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      propertyAddress: `Site Location, ${city}`,
      city,
      state: 'Delhi NCR',
      serviceType: projectType,
      category: 'CONSTRUCTION',
      contractorId: 'pro-unassigned',
      contractorName: 'Team Allocation Pending',
      contractorFirm: 'Platform Partner Network',
      contractorPhone: '+91 98112 00000',
      contractorRole: 'Site Engineer',
      contractValuePaise: totalContractPaise,
      originalContractPaise: totalContractPaise,
      approvedVariationsPaise: 0,
      totalPaidPaise: Math.round(totalContractPaise * 0.10),
      amountAwaitingApprovalPaise: 0,
      amountDuePaise: Math.round(totalContractPaise * 0.15),
      retentionPaise: Math.round(totalContractPaise * 0.05),
      budgetPaise: totalContractPaise,
      progressPercentage: 5,
      overallVerifiedProgress: 5,
      overallReportedProgress: 5,
      currentStage: 'Stage 1: Working Drawings & Sanctions',
      pendingApprovalsCount: 1,
      status: 'AWAITING_TEAM',
      startDate: new Date().toISOString(),
      expectedEndDate: new Date(Date.now() + 180 * 86400000).toISOString(),
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      kickoff: {
        advanceRequiredPaise: Math.round(totalContractPaise * 0.15),
        advancePaid: true,
        advancePaidPaise: Math.round(totalContractPaise * 0.10),
        siteDemarcationReady: true,
        sanctionReceived: true,
        utilityConnectionReady: true,
        contractAgreed: true,
        specialInstructions: 'Project initialized by Super Admin.',
      },
      stages,
      paymentMilestones,
      dailyReports: [],
      issues: [],
      changeOrders: [],
      linkedMaterials: [],
      documents: [],
      messages: [],
      snags: [],
      handover: {
        status: 'NOT_READY',
        possessionSignoff: false,
        snags: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(newPrj);

    // Register customer in store so they can log in and see their project immediately
    registerNewCustomer({
      id: newPrj.customerId,
      name: newPrj.customerName,
      phone: newPrj.customerPhone,
      email: 'customer@buildghar.in',
      housePlotNumber: `Plot Site, ${city}`,
      streetLocality: city,
      city: city,
      state: 'Delhi NCR',
      pinCode: '110001',
      requestsCount: 1,
      bookingsCount: 1,
    });
    pushToCloud().catch(() => {});
    recordPlatformAuditLog({
      action: 'CREATE_PROJECT',
      module: 'PROJECT_MANAGEMENT',
      entity: `${newPrj.name} (${newPrj.code})`,
      newValue: `Budget: ₹${Number(budgetRupees || 0).toLocaleString('en-IN')}`,
    });

    success(`Project ${newPrj.code} created successfully!`);
    setShowCreateModal(false);
    setProjectName('');
    setCustomerName('');
    setCustomerPhone('');
    setCity('');
    setBudgetRupees('');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
              <Building className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Turnkey Projects & Site Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end residential construction sites, multi-disciplinary team allocation, budget audits and progress tracking.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: 'All Projects', value: 'ALL', count: projects.length },
              {
                label: 'Active Sites',
                value: 'ACTIVE',
                count: projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length,
              },
              {
                label: 'Awaiting Team',
                value: 'AWAITING_TEAM',
                count: projects.filter((p) => !p.contractorId || !p.architectId).length,
              },
              {
                label: 'Completed',
                value: 'COMPLETED',
                count: projects.filter((p) => p.status === 'COMPLETED').length,
              },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.value
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project name, code, customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {/* Projects List Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Project / Code</th>
                <th className="py-3 px-3">Homeowner</th>
                <th className="py-3 px-3">Assigned Team</th>
                <th className="py-3 px-3 text-right">Project Budget</th>
                <th className="py-3 px-3 text-center">Progress</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No construction projects found.</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const hasTeam = Boolean(p.contractorId && (p.architectId || p.contractorName));
                  const budget = p.contractValuePaise || p.budgetPaise || p.originalContractPaise || 0;
                  const progress = p.overallVerifiedProgress ?? p.progressPercentage ?? p.overallReportedProgress ?? 0;
                  const projectCode = p.code || p.id || p.requestCode || 'PRJ-2026';
                  const siteCity = p.city || p.siteLocation?.city || 'Delhi NCR';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setSelectedProject(p)}
                          className="cursor-pointer group"
                          title="Click to view project manifest"
                        >
                          <strong className="text-slate-900 group-hover:text-blue-600 transition-colors block text-xs">
                            {p.name}
                          </strong>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span className="font-bold text-blue-700 group-hover:underline">{projectCode}</span>
                            <span>·</span>
                            <span>{siteCity}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div
                          onClick={() => setSelectedProject(p)}
                          className="cursor-pointer group"
                          title="Click to view project manifest"
                        >
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors block">
                            {p.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.customerPhone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {hasTeam ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-slate-800 font-medium">
                              <HardHat className="w-3 h-3 text-amber-600" />
                              <span>{p.contractorName || 'Contractor Team'}</span>
                            </div>
                            {p.architectName && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Compass className="w-3 h-3 text-purple-600" />
                                <span>{p.architectName}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                            Team Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(budget)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="w-24 mx-auto space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Completed</span>
                            <span className="font-bold text-blue-700">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenTeamModal(p)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            title="Assign Architect & Contractor"
                          >
                            <UserCheck className="w-3 h-3 text-amber-600" />
                            <span>Assign Team</span>
                          </button>

                          <button
                            onClick={() => setSelectedProject(p)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="View Project Manifest"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>Site Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ASSIGN PROJECT TEAM */}
      <AnimatePresence>
        {teamModalProject && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setTeamModalProject(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Compass className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Assign Project Execution Team
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Team Matching Desk • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTeamModalProject(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleSaveTeamAssignment} className="p-5 space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-purple-600" />
                    <span>Project Architect (Drawings & Structural Approvals)</span>
                  </label>
                  <select
                    value={assignedArchitectId}
                    onChange={(e) => setAssignedArchitectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="">-- Choose Architect --</option>
                    {architects.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} - {a.firmName} ({a.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Interior Designer (Optional)</span>
                  </label>
                  <select
                    value={assignedDesignerId}
                    onChange={(e) => setAssignedDesignerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="">-- Choose Interior Designer --</option>
                    {designers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} - {d.businessName} ({d.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-amber-600" />
                    <span>Civil / Turnkey Contractor (On-Site Execution) *</span>
                  </label>
                  <select
                    value={assignedContractorId}
                    onChange={(e) => setAssignedContractorId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="">-- Choose Contractor --</option>
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firmName} ({c.name} - {c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setTeamModalProject(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Assignment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>


      {/* MODAL: SITE DETAILS / PROJECT MANIFEST */}
      <AnimatePresence>
        {selectedProject && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Projects Directory</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <Building className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {selectedProject.name}
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/40">
                        {selectedProject.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Code: {selectedProject.code || selectedProject.id || 'PRJ-2026'} • Client: {selectedProject.customerName || selectedProject.clientName || 'Homeowner'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="p-6 space-y-5">
                {/* 1. Location & Customer Grid */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Homeowner</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedProject.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{selectedProject.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Site Location</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {selectedProject.city || selectedProject.siteLocation?.city || 'Delhi NCR'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedProject.propertyAddress || selectedProject.siteLocation?.addressLine1 || 'Verified Construction Site'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Category</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedProject.category || 'CONSTRUCTION'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{selectedProject.serviceType || 'Turnkey Civil Work'}</p>
                  </div>
                </div>

                {/* 2. Financial Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl">
                    <p className="text-[10px] font-bold text-sky-800 uppercase">Contract Budget</p>
                    <p className="text-base font-black text-navy-950 mt-0.5 font-mono">
                      {formatINR(selectedProject.contractValuePaise || selectedProject.budgetPaise || selectedProject.originalContractPaise || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">Total Paid / Escrow</p>
                    <p className="text-base font-black text-emerald-700 mt-0.5 font-mono">
                      {formatINR(selectedProject.totalPaidPaise || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="text-[10px] font-bold text-amber-800 uppercase">Amount Due / Pending</p>
                    <p className="text-base font-black text-amber-800 mt-0.5 font-mono">
                      {formatINR(selectedProject.amountDuePaise || selectedProject.amountAwaitingApprovalPaise || 0)}
                    </p>
                  </div>
                </div>

                {/* 3. Assigned Execution Team */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-amber-600" />
                    <span>Assigned Multi-Disciplinary Site Team</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                          C
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{selectedProject.contractorName || 'Contractor Pending'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{selectedProject.contractorFirm || selectedProject.contractorRole || 'Civil Execution Team'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                          A
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{selectedProject.architectName || 'Architect Assigned'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Design & Structural Review</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Progress & Current Active Stage */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <h4 className="font-bold text-slate-800 text-xs">Work Progress & Verification</h4>
                    <span className="font-mono font-bold text-blue-700">
                      {selectedProject.overallVerifiedProgress ?? selectedProject.progressPercentage ?? 45}% Verified
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      style={{
                        width: `${selectedProject.overallVerifiedProgress ?? selectedProject.progressPercentage ?? 45}%`,
                      }}
                    />
                  </div>

                  {selectedProject.currentStage && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-between text-[11px]">
                      <span className="font-semibold">Current Active Stage:</span>
                      <span className="font-bold text-navy-950">{selectedProject.currentStage}</span>
                    </div>
                  )}
                </div>

                {/* 5. Milestones Escrow Schedule */}
                {selectedProject.paymentMilestones && selectedProject.paymentMilestones.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-2">Milestone Escrow Schedule</h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {(selectedProject.paymentMilestones || []).map((m: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center">
                              {m.milestoneNumber || idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800">{m.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{formatINR(m.amountPaise || 0)}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                m.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.status === 'APPROVED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prj = selectedProject;
                        setSelectedProject(null);
                        handleOpenTeamModal(prj);
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Change Team</span>
                    </button>
                    <a
                      href="/admin/timeline"
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-bold flex items-center gap-1.5 transition"
                    >
                      <HardHat className="w-3.5 h-3.5 text-blue-600" />
                      <span>Inspect Milestones</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    Close Manifest
                  </button>
                </div>
              
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>

      {/* MODAL: CREATE PROJECT (Stepper Wizard) */}
      <AnimatePresence>
        {showCreateModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setProjectStep(1);
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
                  <Building className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create New Construction Project
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {projectStep} of 3 • Civil Engineering Execution Project
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setProjectStep(1);
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
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {[
                  { step: 1, title: 'Project Typology', icon: Building },
                  { step: 2, title: 'Client & Location', icon: MapPin },
                  { step: 3, title: 'Budget & Launch', icon: DollarSign },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < projectStep) setProjectStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          projectStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : projectStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {projectStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          projectStep === item.step
                            ? 'text-blue-900'
                            : projectStep > item.step
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
                          projectStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateProjectSubmit}>
                {/* STEP 1: TYPOLOGY */}
                {projectStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Project Name & Construction Typology
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Define project title, site identification, and building classification.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Official Project Title</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="font-bold text-slate-800 text-sm block">
                          Building Typology <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { type: 'VILLA', label: 'Bespoke Villa', desc: 'Independent Luxury Residence' },
                            { type: 'FLOOR', label: 'Builder Floor', desc: 'Stilt + 4 Floors' },
                            { type: 'RENOVATION', label: 'Home Renovation', desc: 'Structural Modernization' },
                            { type: 'INTERIOR', label: 'Turnkey Interior', desc: 'Complete Spatial Fitout' },
                          ].map((t) => (
                            <button
                              key={t.type}
                              type="button"
                              onClick={() => setProjectType(t.type as any)}
                              className={`p-4 rounded-2xl border text-left transition ${
                                projectType === t.type
                                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="font-bold text-navy-950 text-xs block">{t.label}</span>
                              <span className="text-[10px] text-slate-500 mt-1 block">{t.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CLIENT & LOCATION */}
                {projectStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Homeowner Client & Project Site Location
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify client contact and geographical site city for logistical matching.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Homeowner Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Client Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>Site City / District</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: BUDGET & LAUNCH */}
                {projectStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Total Project Budget & Milestone Launch
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set approved construction valuation. GharDesign will auto-generate 6 physical stage gates and escrow milestones.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          <span>Estimated Construction Budget (₹)</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400 font-bold text-base">₹</span>
                          <input
                            type="number"
                            min={100000}
                            step={50000}
                            placeholder=""
                            value={budgetRupees}
                            onChange={(e) => setBudgetRupees(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-base font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                        <p className="text-xs text-blue-800 font-semibold mt-1">
                          Formatted: {formatINR(Number(budgetRupees || 0) * 100)}
                        </p>
                      </div>

                      {/* Project Manifest Preview */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Project Title</span>
                          <p className="text-sm font-bold text-navy-950 mt-0.5">{projectName || 'Not Entered'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Building Typology</span>
                          <p className="text-sm font-bold text-blue-900 mt-0.5">{projectType}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Client Contact</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{customerName} (+91 {customerPhone})</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site City</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{city}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {projectStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setProjectStep(projectStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {projectStep} of 3
                  </div>

                  {projectStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (projectStep === 1) {
                          if (!projectName.trim()) {
                            error('Please enter the project name');
                            return;
                          }
                        } else if (projectStep === 2) {
                          if (!customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                          const clean = customerPhone.replace(/\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        }
                        setProjectStep(projectStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {projectStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Initialize & Launch Project</span>
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
