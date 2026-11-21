import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  Mail,
  Lock,
  Crown,
  Briefcase,
  Layers,
  KeyRound,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Clock,
  Eye,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  PlatformAdminStaff,
  getPlatformAdminStaff,
  savePlatformAdminStaff,
  toggleAdminStaffStatus,
  recordPlatformAuditLog,
} from '../../data/adminStore.js';

export const AdminStaff: React.FC = () => {
  const { success, error } = useToast();
  const [staffList, setStaffList] = useState<PlatformAdminStaff[]>(() => getPlatformAdminStaff());
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Create Staff Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffStep, setStaffStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<PlatformAdminStaff['role']>('OPERATIONS_MANAGER');
  const [department, setDepartment] = useState('Operations Desk');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'PROJECT_ASSIGNMENTS',
    'KYC_APPROVALS',
  ]);

  const availablePermissions = [
    { key: 'KYC_APPROVALS', label: 'Contractor & Vendor KYC Approvals' },
    { key: 'FINANCIAL_SETTLEMENTS', label: 'Vendor Payouts & UTR Verification' },
    { key: 'ESCROW_PAYOUTS', label: 'Milestone Escrow Payment Releases' },
    { key: 'TEAM_ASSIGNMENTS', label: 'Architect, Designer & Contractor Project Matching' },
    { key: 'SUPPORT_RESOLUTIONS', label: 'Customer Grievances & Ticket Resolution' },
    { key: 'SYSTEM_SETTINGS', label: 'Platform Global Configuration & Rates' },
    { key: 'STAFF_MANAGEMENT', label: 'Staff Accounts & Role Permissions' },
  ];

  const refreshData = () => {
    setStaffList(getPlatformAdminStaff());
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(search) ||
        s.department.toLowerCase().includes(q);

      const matchesRole = selectedRole === 'ALL' || s.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [staffList, search, selectedRole]);

  const stats = useMemo(() => {
    return {
      total: staffList.length,
      superAdmins: staffList.filter((s) => s.role === 'SUPER_ADMIN').length,
      activeStaff: staffList.filter((s) => s.isActive).length,
      operations: staffList.filter((s) => s.role === 'OPERATIONS_MANAGER' || s.role === 'PROJECT_MANAGER').length,
    };
  }, [staffList]);

  const handleToggleStatus = (staffId: string, currentStatus: boolean, staffName: string) => {
    if (staffId === 'adm-1') {
      error('Root Super Administrator account cannot be deactivated.');
      return;
    }

    try {
      const updated = toggleAdminStaffStatus(staffId);
      setStaffList(updated);

      recordPlatformAuditLog({
        action: 'TOGGLE_STAFF_STATUS',
        module: 'STAFF',
        targetId: staffName,
        performedBy: 'Super Administrator',
        notes: `Staff member ${staffName} access status set to ${!currentStatus ? 'ACTIVE' : 'DEACTIVATED'}`,
      });

      success(`Staff member ${staffName} is now ${!currentStatus ? 'ACTIVE' : 'DEACTIVATED'}`);
    } catch {
      error('Failed to change staff status');
    }
  };

  const handleTogglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      error('Please complete all required fields.');
      return;
    }

    try {
      const saved = savePlatformAdminStaff({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim().startsWith('+91') ? phone.trim() : `+91 ${phone.replace(/\D/g, '').slice(-10)}`,
        role,
        department: department.trim(),
        permissions: role === 'SUPER_ADMIN' ? ['ALL_PERMISSIONS', ...selectedPermissions] : selectedPermissions,
        isActive: true,
      });

      recordPlatformAuditLog({
        action: 'CREATE_STAFF',
        module: 'STAFF',
        targetId: saved.name,
        performedBy: 'Super Administrator',
        notes: `Created new staff officer ${saved.name} with role ${saved.role}`,
      });

      success(`Staff account for ${saved.name} created successfully!`);
      setStaffStep(1);
    setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      refreshData();
    } catch {
      error('Failed to create staff account');
    }
  };

  const getRoleBadge = (r: PlatformAdminStaff['role']) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
            <Crown className="w-3 h-3 text-purple-600" />
            <span>SUPER ADMIN</span>
          </span>
        );
      case 'OPERATIONS_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            OPERATIONS MGR
          </span>
        );
      case 'FINANCE_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            FINANCE MGR
          </span>
        );
      case 'VENDOR_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            VENDOR DESK
          </span>
        );
      case 'PROJECT_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            PROJECT LEAD
          </span>
        );
      case 'SUPPORT_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            SUPPORT DESK
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            AUDITOR / READ-ONLY
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-950">Staff & Role-Based Access Control (RBAC)</h1>
              <p className="text-xs text-slate-500">
                Manage platform internal employees, assign operational permissions, and audit administrative privileges
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Platform Staff</p>
          <p className="text-2xl font-black text-navy-950 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Authorized internal operators</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Super Administrators</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{stats.superAdmins}</p>
          <p className="text-[10px] text-purple-600/70 mt-0.5">Unrestricted root access</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Operators</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.activeStaff}</p>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">Currently enabled accounts</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sky-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Site & Project Leads</p>
          <p className="text-2xl font-black text-sky-600 mt-1">{stats.operations}</p>
          <p className="text-[10px] text-sky-600/70 mt-0.5">Field operations & inspections</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, email, department, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="OPERATIONS_MANAGER">Operations Manager</option>
              <option value="FINANCE_MANAGER">Finance Manager</option>
              <option value="VENDOR_MANAGER">Vendor Manager</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="SUPPORT_MANAGER">Support Manager</option>
              <option value="READ_ONLY_ADMIN">Auditor / Read-Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Assigned Permissions</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No platform staff match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold flex items-center justify-center shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-navy-950">{staff.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {staff.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{staff.phone}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{staff.email}</span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {staff.department}
                    </td>
                    <td className="py-3.5 px-4">
                      {getRoleBadge(staff.role)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(staff.permissions || []).map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {staff.lastLogin ? new Date(staff.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(staff.id, staff.isActive, staff.name)}
                        disabled={staff.id === 'adm-1'}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          staff.id === 'adm-1' ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          staff.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {staff.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ACTIVE</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>DEACTIVATED</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {staff.id !== 'adm-1' && (
                        <button
                          onClick={() => handleToggleStatus(staff.id, staff.isActive, staff.name)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold transition"
                        >
                          {staff.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Add Platform Staff Member
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Staff RBAC Desk • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* STEPPER PROGRESS BAR */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-sm">
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {[
                  { step: 1, title: '1. Identity & Department', desc: 'Employee Name, Contact & Department' },
                  { step: 2, title: '2. Role & Permissions', desc: 'System RBAC Authority & Granular Access' },
                ].map((s) => {
                  const isActive = staffStep === s.step;
                  const isCompleted = staffStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setStaffStep(s.step as 1 | 2)}
                      className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-center ${
                        isActive
                          ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                          : isCompleted
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? 'bg-purple-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                        </span>
                        <span className="font-bold text-xs text-navy-950 truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-7 hidden sm:inline truncate">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateStaff} className="space-y-6 text-xs text-slate-700">
                {/* STEP 1: IDENTITY */}
                {staffStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 1: Employee Identity & Department</h3>
                      <p className="text-xs text-slate-500">Provide official contact credentials and platform department assignment.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Employee Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Official Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder=""
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Corporate Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder=""
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Assigned Department *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!name.trim() || !phone.trim() || !email.trim()) {
                            alert('Please fill out Name, Phone and Corporate Email.');
                            return;
                          }
                          setStaffStep(2);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <span>Proceed to Role & Permissions</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: ROLE & PERMISSIONS */}
                {staffStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 2: Role Assignment & Granular Permissions</h3>
                      <p className="text-xs text-slate-500">Configure administrative authority and individual operational gates.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">System Role & Authority Level *</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                        >
                          <option value="OPERATIONS_MANAGER">Operations Manager (Site & Team Dispatch)</option>
                          <option value="FINANCE_MANAGER">Finance Manager (Escrow & Vendor Payouts)</option>
                          <option value="VENDOR_MANAGER">Vendor Manager (Depots & Catalog)</option>
                          <option value="PROJECT_MANAGER">Project Manager (Milestone Execution)</option>
                          <option value="SUPPORT_MANAGER">Support Manager (Tickets & Complaints)</option>
                          <option value="SUPER_ADMIN">Super Administrator (Full Unrestricted Access)</option>
                          <option value="READ_ONLY_ADMIN">Auditor / Read-Only Analyst</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1.5">Granular Functional Permissions</label>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {availablePermissions.map((perm) => (
                            <label
                              key={perm.key}
                              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.key)}
                                onChange={() => handleTogglePermission(perm.key)}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-slate-800 font-medium">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Summary card */}
                      <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200/80">
                        <div className="text-[11px] font-bold text-purple-900 uppercase mb-2">Staff Member Summary</div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-slate-500">Name:</span> <span className="font-bold text-navy-950">{name}</span></div>
                          <div><span className="text-slate-500">Role:</span> <span className="font-mono font-bold text-purple-700">{role}</span></div>
                          <div><span className="text-slate-500">Email:</span> <span className="font-bold text-slate-800">{email}</span></div>
                          <div><span className="text-slate-500">Permissions:</span> <span className="font-bold text-emerald-700">{selectedPermissions.length} Active Gates</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStaffStep(1)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Step 1</span>
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Provision Staff Member</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStaff;
