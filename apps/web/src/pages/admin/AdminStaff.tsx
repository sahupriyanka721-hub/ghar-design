import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  ArrowRight,
  Check,
  Shield,
  Clock,
  Eye,
  RefreshCw,
  FileText,
  Terminal,
  Sliders,
  ChevronDown,
  Award,
  AlertTriangle,
  Edit2,
  ExternalLink,
} from 'lucide-react';

import { useToast } from '../../context/ToastContext.js';

import {
  MasterAdminRole,
  AdminPermission,
  ADMIN_ROLE_DEFINITIONS,
  MasterAdminUser,
  getAdminStaffUsers,
  saveAdminStaffUser,
  getActiveAdminRole,
  setActiveAdminRole,
  hasAdminPermission,
  AdminAuditEntry,
  logAdminAuditAction,
  getAdminAuditLogs,
} from '../../data/adminRbacStore.js';

import {
  PlatformAdminStaff,
  getPlatformAdminStaff,
  savePlatformAdminStaff,
  toggleAdminStaffStatus,
  recordPlatformAuditLog,
  PlatformAuditLog,
  getPlatformAuditLogs,
} from '../../data/adminStore.js';

export type AdminStaffView =
  | 'ADMIN_USERS'
  | 'CREATE_ADMIN'
  | 'ROLES_PERMISSIONS'
  | 'ACTIVITY_LOGS';

interface ViewTabMeta {
  key: AdminStaffView;
  label: string;
  icon: any;
  shortDesc: string;
}

const VIEW_TABS: ViewTabMeta[] = [
  {
    key: 'ADMIN_USERS',
    label: 'Admin Users',
    icon: User,
    shortDesc: 'Directory of all active and suspended platform administrative personnel',
  },
  {
    key: 'CREATE_ADMIN',
    label: 'Create Admin',
    icon: Plus,
    shortDesc: 'Onboard new administrative staff member and assign customized RBAC permissions',
  },
  {
    key: 'ROLES_PERMISSIONS',
    label: 'Roles & Permissions',
    icon: ShieldCheck,
    shortDesc: 'Master matrix of 8 administrative roles, authority limits and simulation',
  },
  {
    key: 'ACTIVITY_LOGS',
    label: 'Activity Logs',
    icon: FileText,
    shortDesc: 'Chronological security ledger recording all administrative decisions and access events',
  },
];

const ALL_AVAILABLE_PERMISSIONS: { key: AdminPermission; label: string; desc: string }[] = [
  { key: 'MANAGE_USERS', label: 'Admin Staff & User Management', desc: 'Create, modify, and deactivate administrative staff and credentials' },
  { key: 'VERIFY_ARCHITECTS', label: 'Architect KYC & COA Verification', desc: 'Approve or reject Council of Architecture credentials and licenses' },
  { key: 'MANAGE_CUSTOMERS', label: 'Customer Management', desc: 'View customer accounts, update statuses and inspect profile details' },
  { key: 'MANAGE_QUOTATION_REQUESTS', label: 'Quotation Request Desk', desc: 'Assign incoming homeowner requests to architects and monitor response SLAs' },
  { key: 'REVIEW_QUOTATIONS', label: 'Quotation Audit & Forwarding', desc: 'Approve, request revisions, or finalize architect price proposals' },
  { key: 'MANAGE_PROJECTS', label: 'Project Kickoff & Supervision', desc: 'Initiate active projects, place on hold, or record delay escalations' },
  { key: 'REVIEW_DESIGNS', label: 'Design & Drawing Approval', desc: 'Verify floor plans, 3D renders, and structural blueprints before client delivery' },
  { key: 'INSPECT_MILESTONES', label: 'Site Inspection & Milestone Verification', desc: 'Sign off physical on-site progress and milestone quality compliance' },
  { key: 'VERIFY_PAYMENTS', label: 'Customer Escrow Verification', desc: 'Confirm incoming bank gateway and UTR payments into escrow' },
  { key: 'PROCESS_PAYOUTS', label: 'Architect Payout Releases', desc: 'Authorize milestone payout releases from escrow to architects' },
  { key: 'MANAGE_COMMUNICATIONS', label: 'Communication Hub Moderation', desc: 'Monitor and moderate customer-architect routed conversations' },
  { key: 'RESOLVE_DISPUTES', label: 'Dispute & Complaint Arbitration', desc: 'Investigate formal grievances, resolve hold-ups, and issue refund orders' },
  { key: 'VIEW_REPORTS', label: 'Business Reports & Analytics', desc: 'Access financial, revenue, conversion, and performance telemetry' },
  { key: 'MANAGE_SETTINGS', label: 'Platform Settings & Rate Matrix', desc: 'Update commission schedules, GST rules, gateway configurations and CMS' },
  { key: 'VIEW_AUDIT_LOGS', label: 'Security Audit Trail', desc: 'Inspect system-wide immutable activity logs and authentication attempts' },
];

export const AdminStaff: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active View from URL (?view=)
  const rawView = searchParams.get('view') as AdminStaffView | null;
  const activeView: AdminStaffView = rawView && VIEW_TABS.some((t) => t.key === rawView)
    ? rawView
    : 'ADMIN_USERS';

  const setView = (newView: AdminStaffView) => {
    setSearchParams({ view: newView });
  };

  // --------------------------------------------------------------------------
  // STORE STATES
  // --------------------------------------------------------------------------
  const [staffUsers, setStaffUsers] = useState<MasterAdminUser[]>(() => getAdminStaffUsers());
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>(() => getAdminAuditLogs());
  const [activeRole, setActiveRole] = useState<MasterAdminRole>(() => getActiveAdminRole());

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Create Admin Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState(`BG-EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [formRole, setFormRole] = useState<MasterAdminRole>('OPERATIONS_ADMIN');
  const [formDepartment, setFormDepartment] = useState('Operations & Fulfillment Desk');
  const [formPermissions, setFormPermissions] = useState<AdminPermission[]>(() => {
    return ADMIN_ROLE_DEFINITIONS['OPERATIONS_ADMIN']?.defaultPermissions || [];
  });
  const [formEnforceMfa, setFormEnforceMfa] = useState(true);

  // Edit Staff Modal State
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<MasterAdminUser | null>(null);

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditEntry | null>(null);

  // Refresh data from stores
  const refreshData = () => {
    setStaffUsers(getAdminStaffUsers());
    setAuditLogs(getAdminAuditLogs());
    setActiveRole(getActiveAdminRole());
  };

  useEffect(() => {
    const handleRoleSwitch = (e: any) => {
      setActiveRole(e.detail || getActiveAdminRole());
      refreshData();
    };
    window.addEventListener('admin_role_switched', handleRoleSwitch);
    window.addEventListener('ADMIN_AUDIT_LOGGED', refreshData);
    return () => {
      window.removeEventListener('admin_role_switched', handleRoleSwitch);
      window.removeEventListener('ADMIN_AUDIT_LOGGED', refreshData);
    };
  }, []);

  // Update default permissions when form role changes
  const handleRoleChangeInForm = (role: MasterAdminRole) => {
    setFormRole(role);
    const meta = ADMIN_ROLE_DEFINITIONS[role];
    if (meta) {
      setFormDepartment(meta.department);
      setFormPermissions(meta.defaultPermissions);
    }
  };

  // Toggle permission in create form
  const handleTogglePermission = (permKey: AdminPermission) => {
    if (formPermissions.includes(permKey)) {
      setFormPermissions(formPermissions.filter((p) => p !== permKey));
    } else {
      setFormPermissions([...formPermissions, permKey]);
    }
  };

  // --------------------------------------------------------------------------
  // CREATE ADMIN HANDLER
  // --------------------------------------------------------------------------
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      error('Please complete all required fields (Name, Email, Mobile).');
      return;
    }

    try {
      const newUser: MasterAdminUser = {
        id: `adm-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        role: formRole,
        department: formDepartment.trim() || ADMIN_ROLE_DEFINITIONS[formRole]?.department || 'Platform Operations',
        permissions: formPermissions,
        isActive: true,
        lastLogin: 'Never (Newly Created)',
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        isRoot: false,
      };

      saveAdminStaffUser(newUser);

      // Also sync to legacy adminStore
      savePlatformAdminStaff({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role as any,
        department: newUser.department,
        permissions: newUser.permissions as any,
        isActive: true,
        lastActive: 'Just Now',
        avatarUrl: newUser.avatar,
      });

      // Audit logs
      recordPlatformAuditLog({
        action: 'CREATE_ADMIN_USER',
        module: 'STAFF_MANAGEMENT',
        targetId: newUser.id,
        performedBy: 'Super Administrator',
        notes: `Created admin user ${newUser.name} with role ${newUser.role}`,
      });

      logAdminAuditAction({
        action: 'CREATE_ADMIN_ACCOUNT',
        targetType: 'ADMIN_USER',
        targetId: newUser.id,
        description: `Created administrative staff account for ${newUser.name} (${newUser.email}) with ${newUser.role} credentials.`,
      });

      refreshData();
      success(`Admin user "${newUser.name}" successfully created!`);

      // Reset form
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormEmployeeId(`BG-EMP-${Math.floor(1000 + Math.random() * 9000)}`);
      // Navigate to Users directory
      setView('ADMIN_USERS');
    } catch {
      error('Failed to create administrative account.');
    }
  };

  // --------------------------------------------------------------------------
  // TOGGLE STATUS HANDLER
  // --------------------------------------------------------------------------
  const handleToggleStaffStatus = (user: MasterAdminUser) => {
    if (user.isRoot || user.role === 'SUPER_ADMIN') {
      error('Root Super Administrator account cannot be deactivated.');
      return;
    }

    const updatedUser: MasterAdminUser = {
      ...user,
      isActive: !user.isActive,
    };

    saveAdminStaffUser(updatedUser);
    toggleAdminStaffStatus(user.id);

    logAdminAuditAction({
      action: user.isActive ? 'DEACTIVATE_ADMIN_USER' : 'ACTIVATE_ADMIN_USER',
      targetType: 'ADMIN_USER',
      targetId: user.id,
      description: `Administrative access for ${user.name} (${user.role}) was ${user.isActive ? 'suspended' : 'activated'}.`,
    });

    refreshData();
    success(`Account status for ${user.name} updated to ${updatedUser.isActive ? 'Active' : 'Suspended'}.`);
  };

  // --------------------------------------------------------------------------
  // ROLE SIMULATION HANDLER
  // --------------------------------------------------------------------------
  const handleSimulateRole = (role: MasterAdminRole) => {
    setActiveAdminRole(role);
    setActiveRole(role);
    success(`Switched console simulation mode to "${ADMIN_ROLE_DEFINITIONS[role]?.title}"!`);
  };

  // --------------------------------------------------------------------------
  // EDIT USER HANDLER
  // --------------------------------------------------------------------------
  const handleOpenEditUser = (user: MasterAdminUser) => {
    setEditingUser({ ...user });
    setEditUserModalOpen(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    saveAdminStaffUser(editingUser);
    refreshData();
    setEditUserModalOpen(false);
    success(`Staff user "${editingUser.name}" updated successfully.`);
  };

  // --------------------------------------------------------------------------
  // FILTERED DATA
  // --------------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return staffUsers.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(searchQuery) ||
        u.department.toLowerCase().includes(q);
      const matchesRole = filterRole === 'ALL' || u.role === filterRole;
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && u.isActive) ||
        (filterStatus === 'DISABLED' && !u.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffUsers, searchQuery, filterRole, filterStatus]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.adminName.toLowerCase().includes(q) ||
        log.targetType.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.adminRole.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: staffUsers.length,
      active: staffUsers.filter((u) => u.isActive).length,
      superAdmins: staffUsers.filter((u) => u.role === 'SUPER_ADMIN').length,
      logsCount: auditLogs.length,
    };
  }, [staffUsers, auditLogs]);

  const activeMeta = VIEW_TABS.find((t) => t.key === activeView) || VIEW_TABS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* -------------------------------------------------------------------- */}
      {/* 1. TOP HEADER & VIEW SWITCHER DROPDOWN                                */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-navy-950">19. Admin User & Role Management</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                  RBAC Security Desk
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage administrative personnel accounts, configure 8 master role permissions, and review security audit trail
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* View Selector Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={activeView}
                onChange={(e) => setView(e.target.value as AdminStaffView)}
                className="w-full sm:w-64 pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
              >
                {VIEW_TABS.map((tab, idx) => (
                  <option key={tab.key} value={tab.key}>
                    {idx + 1}. {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Contextual Action */}
            {activeView !== 'CREATE_ADMIN' && (
              <button
                onClick={() => setView('CREATE_ADMIN')}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Admin</span>
              </button>
            )}

            <button
              onClick={refreshData}
              title="Refresh staff and logs"
              className="p-2 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* HORIZONTAL PILL NAV BAR (ALL 4 VIEWS)                             */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 scrollbar-none">
          {VIEW_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isCurrent = activeView === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-navy-950'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.key === 'ADMIN_USERS' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {stats.total}
                  </span>
                )}
                {tab.key === 'ROLES_PERMISSIONS' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    8 Roles
                  </span>
                )}
                {tab.key === 'ACTIVITY_LOGS' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {stats.logsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* CONTEXTUAL FEATURE HEADER BANNER                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-navy-950 uppercase tracking-wider">
                Module 19
              </span>
              <h2 className="text-base font-bold text-white">{activeMeta.label}</h2>
            </div>
            <p className="text-xs text-purple-200 max-w-2xl">{activeMeta.shortDesc}</p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-amber-300">{stats.total}</div>
              <div className="text-[10px] text-purple-200 uppercase">Total Admins</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-emerald-300">{stats.active}</div>
              <div className="text-[10px] text-purple-200 uppercase">Active Staff</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-sky-300">8</div>
              <div className="text-[10px] text-purple-200 uppercase">Master Roles</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-rose-300">{stats.logsCount}</div>
              <div className="text-[10px] text-purple-200 uppercase">Audit Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: ADMIN USERS DIRECTORY                                        */}
      {/* ==================================================================== */}
      {activeView === 'ADMIN_USERS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Administrative Personnel Directory ({filteredUsers.length})</h3>
                <p className="text-xs text-slate-500">
                  Staff accounts with role assignments, contact details, active session impersonation and status management
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="ALL">All Roles (8)</option>
                  {Object.keys(ADMIN_ROLE_DEFINITIONS).map((rKey) => (
                    <option key={rKey} value={rKey}>
                      {ADMIN_ROLE_DEFINITIONS[rKey as MasterAdminRole].title}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Suspended</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search admin name, email, phone..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Admin Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => {
                const roleMeta = ADMIN_ROLE_DEFINITIONS[user.role] || ADMIN_ROLE_DEFINITIONS.SUPER_ADMIN;
                const isCurrentActive = activeRole === user.role;

                return (
                  <div
                    key={user.id}
                    className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                      user.isActive
                        ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
                        : 'bg-slate-50 opacity-60 border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                            />
                            {user.isRoot && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-navy-950 flex items-center justify-center shadow-xs">
                                <Crown className="w-3 h-3 fill-amber-950" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-navy-950">{user.name}</h4>
                              {user.isRoot && (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                  Root
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">{user.department}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>

                      {/* Role Badge */}
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${roleMeta.badgeColor}`}>
                          {roleMeta.title}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Last login: {user.lastLogin}</span>
                        </div>
                      </div>

                      {/* Permissions overview */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-500">
                          {user.permissions.includes('ALL_PERMISSIONS') ? 'Full Master Access (16 of 16)' : `${user.permissions.length} Granted Permissions`}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSimulateRole(user.role)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                          isCurrentActive
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{isCurrentActive ? 'Current Role' : 'Simulate'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {!user.isRoot && (
                          <button
                            onClick={() => handleToggleStaffStatus(user)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              user.isActive
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {user.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditUser(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: CREATE ADMIN                                                 */}
      {/* ==================================================================== */}
      {activeView === 'CREATE_ADMIN' && (
        <form onSubmit={handleCreateAdmin} className="space-y-5 max-w-4xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Onboard New Administrative Personnel</h3>
                <p className="text-xs text-slate-500">
                  Provision new employee login credentials, assign primary role, and grant tailored module permissions
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-mono font-bold">
                {formEmployeeId}
              </span>
            </div>

            {/* Section 1: Personal Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider text-slate-400">
                1. Identification & Contact Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Vikramaditya Rathore"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. vikram@buildghar.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Verified Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Role Selection */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider text-slate-400">
                2. Administrative Persona & Designation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Master Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChangeInForm(e.target.value as MasterAdminRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-purple-900 focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.keys(ADMIN_ROLE_DEFINITIONS).map((rKey) => (
                      <option key={rKey} value={rKey}>
                        {ADMIN_ROLE_DEFINITIONS[rKey as MasterAdminRole].title} ({rKey})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Department</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g. Operations & Lead Fulfillment"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Role Scope Highlight */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-900">
                <strong>Scope for {ADMIN_ROLE_DEFINITIONS[formRole]?.title}:</strong>{' '}
                {ADMIN_ROLE_DEFINITIONS[formRole]?.description}
              </div>
            </div>

            {/* Section 3: Granular Permissions */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider text-slate-400">
                  3. Granular Module Permissions
                </h4>
                <span className="text-[11px] font-bold text-purple-700">
                  {formPermissions.includes('ALL_PERMISSIONS') ? 'Full Access Granted' : `${formPermissions.length} Selected`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = formPermissions.includes('ALL_PERMISSIONS') || formPermissions.includes(perm.key);
                  const isMasterLocked = formPermissions.includes('ALL_PERMISSIONS') && perm.key !== 'ALL_PERMISSIONS';

                  return (
                    <label
                      key={perm.key}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition cursor-pointer select-none ${
                        isChecked
                          ? 'bg-purple-50/40 border-purple-200'
                          : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isMasterLocked}
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.key)}
                        className="w-4 h-4 text-purple-600 rounded mt-0.5 cursor-pointer disabled:opacity-50"
                      />
                      <div>
                        <div className="text-xs font-bold text-navy-950">{perm.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight">{perm.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Security Flags */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enforceMfa"
                  checked={formEnforceMfa}
                  onChange={(e) => setFormEnforceMfa(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="enforceMfa" className="font-semibold text-slate-700 cursor-pointer">
                  Enforce Two-Factor Authentication (OTP on mobile login)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView('ADMIN_USERS')}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Admin Account</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: ROLES & PERMISSIONS MATRIX                                   */}
      {/* ==================================================================== */}
      {activeView === 'ROLES_PERMISSIONS' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Master Role Definitions & Authority Limits (8 Roles)</h3>
                <p className="text-xs text-slate-500">
                  Standard RBAC configuration based on Section 3 & 19 of ADMIN_PANEL_MASTER_SPEC.md
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.keys(ADMIN_ROLE_DEFINITIONS).map((rKey) => {
                const role = rKey as MasterAdminRole;
                const meta = ADMIN_ROLE_DEFINITIONS[role];
                const isCurrentSimulated = activeRole === role;
                const assignedCount = staffUsers.filter((u) => u.role === role).length;

                return (
                  <div
                    key={role}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                      isCurrentSimulated
                        ? 'bg-purple-50/50 border-purple-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.badgeColor}`}>
                          {meta.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">{assignedCount} Users</span>
                      </div>

                      <div className="text-[11px] font-semibold text-purple-900">{meta.department}</div>
                      <p className="text-[11px] text-slate-600 leading-snug">{meta.description}</p>

                      {/* Permissions List Preview */}
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Granted Powers:</div>
                        {meta.defaultPermissions.includes('ALL_PERMISSIONS') ? (
                          <div className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                            <span>Unrestricted Master Authority</span>
                          </div>
                        ) : (
                          meta.defaultPermissions.slice(0, 4).map((p) => (
                            <div key={p} className="text-[10px] text-slate-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{p.replace(/_/g, ' ')}</span>
                            </div>
                          ))
                        )}
                        {!meta.defaultPermissions.includes('ALL_PERMISSIONS') && meta.defaultPermissions.length > 4 && (
                          <div className="text-[10px] text-slate-400 italic">
                            +{meta.defaultPermissions.length - 4} more permissions
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleSimulateRole(role)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isCurrentSimulated
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-900'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{isCurrentSimulated ? 'Active Simulation' : 'Simulate Role'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: ACTIVITY LOGS & AUDIT LEDGER                                 */}
      {/* ==================================================================== */}
      {activeView === 'ACTIVITY_LOGS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Administrative Security Ledger ({filteredLogs.length})</h3>
                <p className="text-xs text-slate-500">
                  Tamper-resistant operational logs recording all administrative decisions, role changes, and KYC approvals
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by keyword, admin..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <Link
                  to="/admin/audit-logs"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <span>Full Audit Trail</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Admin Performer</th>
                    <th className="py-2.5 px-4">Action Event</th>
                    <th className="py-2.5 px-4">Target Type</th>
                    <th className="py-2.5 px-4">Details</th>
                    <th className="py-2.5 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No activity records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-purple-50/30 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-navy-950">{log.adminName}</div>
                          <span className="text-[10px] text-purple-700 font-semibold">{log.adminRole}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{log.targetType}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{log.description}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                            title="Inspect Entry"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT STAFF USER                                               */}
      {/* ==================================================================== */}
      {editUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-950">Edit Staff Member ({editingUser.name})</h3>
              <button onClick={() => setEditUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  disabled={editingUser.isRoot}
                  value={editingUser.role}
                  onChange={(e) => {
                    const newRole = e.target.value as MasterAdminRole;
                    setEditingUser({
                      ...editingUser,
                      role: newRole,
                      permissions: ADMIN_ROLE_DEFINITIONS[newRole]?.defaultPermissions || editingUser.permissions,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-purple-900 disabled:opacity-50"
                >
                  {Object.keys(ADMIN_ROLE_DEFINITIONS).map((rKey) => (
                    <option key={rKey} value={rKey}>
                      {ADMIN_ROLE_DEFINITIONS[rKey as MasterAdminRole].title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: INSPECT LOG ENTRY                                             */}
      {/* ==================================================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-950">Security Audit Entry Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Log ID</span>
                  <span className="font-mono text-slate-800">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Timestamp</span>
                  <span className="font-mono text-slate-800">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Admin Performer</span>
                  <span className="font-bold text-navy-950">{selectedLog.adminName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Performer Role</span>
                  <span className="text-purple-700 font-semibold">{selectedLog.adminRole}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Action Trigger</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Target Entity</span>
                  <span className="font-mono text-slate-800">{selectedLog.targetType} ({selectedLog.targetId})</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-semibold mb-1">Description Payload</span>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl whitespace-pre-wrap">
                  {selectedLog.description}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
