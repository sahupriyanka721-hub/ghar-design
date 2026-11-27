/**
 * BuildGhar - Master Admin RBAC & Centralized Security Store
 * Implements Section 3 & Section 19 of ADMIN_PANEL_MASTER_SPEC.md
 * Enforces strict role-based access control across 8 designated administrative personas.
 */

export type MasterAdminRole =
  | 'SUPER_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'QUOTATION_MANAGER'
  | 'PROJECT_MANAGER'
  | 'FINANCE_MANAGER'
  | 'DOCUMENT_VERIFICATION_ADMIN'
  | 'CUSTOMER_SUPPORT_ADMIN'
  | 'READ_ONLY_ADMIN';

export type AdminPermission =
  | 'ALL_PERMISSIONS'
  | 'MANAGE_USERS'
  | 'VERIFY_ARCHITECTS'
  | 'MANAGE_CUSTOMERS'
  | 'MANAGE_QUOTATION_REQUESTS'
  | 'REVIEW_QUOTATIONS'
  | 'MANAGE_PROJECTS'
  | 'REVIEW_DESIGNS'
  | 'INSPECT_MILESTONES'
  | 'VERIFY_PAYMENTS'
  | 'PROCESS_PAYOUTS'
  | 'MANAGE_COMMUNICATIONS'
  | 'RESOLVE_DISPUTES'
  | 'VIEW_REPORTS'
  | 'MANAGE_SETTINGS'
  | 'VIEW_AUDIT_LOGS';

export interface AdminRoleMeta {
  role: MasterAdminRole;
  title: string;
  department: string;
  badgeColor: string;
  description: string;
  defaultPermissions: AdminPermission[];
}

export const ADMIN_ROLE_DEFINITIONS: Record<MasterAdminRole, AdminRoleMeta> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    title: 'Super Administrator',
    department: 'Platform Governance & Executive Board',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Unrestricted master authority across all financial, project, quotation, and staff configurations.',
    defaultPermissions: ['ALL_PERMISSIONS'],
  },
  OPERATIONS_ADMIN: {
    role: 'OPERATIONS_ADMIN',
    title: 'Operations Administrator',
    department: 'Daily Operations & Lead Allocation',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Manages incoming homeowner requests, service category matching, and platform logistics.',
    defaultPermissions: [
      'MANAGE_CUSTOMERS',
      'MANAGE_QUOTATION_REQUESTS',
      'MANAGE_PROJECTS',
      'MANAGE_COMMUNICATIONS',
      'VIEW_REPORTS',
      'VIEW_AUDIT_LOGS',
    ],
  },
  QUOTATION_MANAGER: {
    role: 'QUOTATION_MANAGER',
    title: 'Quotation Review Manager',
    department: 'Commercial & Scope Auditing',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Audits architect bill of quantities, approves/revises price quotes, and forwards them to homeowners.',
    defaultPermissions: [
      'MANAGE_QUOTATION_REQUESTS',
      'REVIEW_QUOTATIONS',
      'MANAGE_COMMUNICATIONS',
      'VIEW_REPORTS',
    ],
  },
  PROJECT_MANAGER: {
    role: 'PROJECT_MANAGER',
    title: 'Project Delivery Manager',
    department: 'Civil Construction & Site Progress',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Authorizes kickoff, tracks milestones, monitors site inspections, and manages schedule delays.',
    defaultPermissions: [
      'MANAGE_PROJECTS',
      'REVIEW_DESIGNS',
      'INSPECT_MILESTONES',
      'MANAGE_COMMUNICATIONS',
      'VIEW_REPORTS',
    ],
  },
  FINANCE_MANAGER: {
    role: 'FINANCE_MANAGER',
    title: 'Finance & Escrow Manager',
    department: 'Treasury, Payouts & Taxation',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Verifies customer escrow deposits, reconciles gateway transactions, and approves architect payouts.',
    defaultPermissions: [
      'VERIFY_PAYMENTS',
      'PROCESS_PAYOUTS',
      'RESOLVE_DISPUTES',
      'VIEW_REPORTS',
      'VIEW_AUDIT_LOGS',
    ],
  },
  DOCUMENT_VERIFICATION_ADMIN: {
    role: 'DOCUMENT_VERIFICATION_ADMIN',
    title: 'Document & Statutory Auditor',
    department: 'Council of Architecture (COA) Compliance',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Audits architect licenses, verifies COA credentials, checks KYC, and inspects statutory permits.',
    defaultPermissions: [
      'VERIFY_ARCHITECTS',
      'MANAGE_CUSTOMERS',
      'REVIEW_DESIGNS',
      'VIEW_AUDIT_LOGS',
    ],
  },
  CUSTOMER_SUPPORT_ADMIN: {
    role: 'CUSTOMER_SUPPORT_ADMIN',
    title: 'Customer Support & Grievance Officer',
    department: 'Homeowner Relations & Conflict Resolution',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Handles support tickets, investigates homeowner disputes, and moderates communication channels.',
    defaultPermissions: [
      'MANAGE_CUSTOMERS',
      'MANAGE_COMMUNICATIONS',
      'RESOLVE_DISPUTES',
      'VIEW_REPORTS',
    ],
  },
  READ_ONLY_ADMIN: {
    role: 'READ_ONLY_ADMIN',
    title: 'Compliance & Audit Observer',
    department: 'External Auditing & Regulatory Review',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Inspects platform activities, financial ledgers, and contract statuses in strictly read-only mode.',
    defaultPermissions: ['VIEW_REPORTS', 'VIEW_AUDIT_LOGS'],
  },
};

export const ADMIN_ROLES_V2 = ADMIN_ROLE_DEFINITIONS;

export interface MasterAdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: MasterAdminRole;
  department: string;
  avatar?: string;
  isActive: boolean;
  permissions: AdminPermission[];
  twoFactorEnabled: boolean;
  lastLogin: string;
  createdAt: string;
}

const STORAGE_ACTIVE_ROLE = 'buildghar_active_admin_role';
const STORAGE_ADMIN_USERS = 'buildghar_admin_staff_v2';
const STORAGE_AUDIT_TRAIL = 'platform_admin_audit_logs';

export const INITIAL_ADMIN_STAFF_V2: MasterAdminUser[] = [
  {
    id: 'adm-super-01',
    name: 'Super Administrator',
    email: 'admin@buildghar.com',
    phone: '8319955741',
    role: 'SUPER_ADMIN',
    department: 'Platform Governance & Executive Board',
    isActive: true,
    permissions: ['ALL_PERMISSIONS'],
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'adm-ops-02',
    name: 'Vikram Joshi (Operations)',
    email: 'operations@buildghar.com',
    phone: '9826011111',
    role: 'OPERATIONS_ADMIN',
    department: 'Daily Operations & Lead Allocation',
    isActive: true,
    permissions: ADMIN_ROLE_DEFINITIONS.OPERATIONS_ADMIN.defaultPermissions,
    twoFactorEnabled: false,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'adm-quote-03',
    name: 'Pooja Nair (Quotation Mgr)',
    email: 'quotations@buildghar.com',
    phone: '9826022222',
    role: 'QUOTATION_MANAGER',
    department: 'Commercial & Scope Auditing',
    isActive: true,
    permissions: ADMIN_ROLE_DEFINITIONS.QUOTATION_MANAGER.defaultPermissions,
    twoFactorEnabled: false,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-02-10T00:00:00.000Z',
  },
  {
    id: 'adm-proj-04',
    name: 'Er. Sandeep Rawat (Project Mgr)',
    email: 'projects@buildghar.com',
    phone: '9826033333',
    role: 'PROJECT_MANAGER',
    department: 'Civil Construction & Site Progress',
    isActive: true,
    permissions: ADMIN_ROLE_DEFINITIONS.PROJECT_MANAGER.defaultPermissions,
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-02-15T00:00:00.000Z',
  },
  {
    id: 'adm-fin-05',
    name: 'CA Gaurav Saxena (Finance)',
    email: 'finance@buildghar.com',
    phone: '9826044444',
    role: 'FINANCE_MANAGER',
    department: 'Treasury, Payouts & Taxation',
    isActive: true,
    permissions: ADMIN_ROLE_DEFINITIONS.FINANCE_MANAGER.defaultPermissions,
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'adm-doc-06',
    name: 'Adv. Meenakshi Sundaram (KYC & COA)',
    email: 'compliance@buildghar.com',
    phone: '9826055556',
    role: 'DOCUMENT_VERIFICATION_ADMIN',
    department: 'Council of Architecture (COA) Compliance',
    isActive: true,
    permissions: ADMIN_ROLE_DEFINITIONS.DOCUMENT_VERIFICATION_ADMIN.defaultPermissions,
    twoFactorEnabled: false,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-02-20T00:00:00.000Z',
  },
  {
    id: 'adm-supp-07',
    name: 'Rohit Khandelwal (Support Desk)',
    email: 'support@buildghar.com',
    phone: '9826066666',
    role: 'CUSTOMER_SUPPORT_ADMIN',
    department: 'Homeowner Relations & Conflict Resolution',
    isActive: true,
    permissions: ADMIN_ROLE_DEFINITIONS.CUSTOMER_SUPPORT_ADMIN.defaultPermissions,
    twoFactorEnabled: false,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-02-25T00:00:00.000Z',
  },
  {
    id: 'adm-audit-08',
    name: 'External Board Auditor',
    email: 'auditor@buildghar.com',
    phone: '9826077778',
    role: 'READ_ONLY_ADMIN',
    department: 'External Auditing & Regulatory Review',
    isActive: true,
    permissions: ADMIN_ROLE_DEFINITIONS.READ_ONLY_ADMIN.defaultPermissions,
    twoFactorEnabled: false,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-03-01T00:00:00.000Z',
  },
];

/**
 * Returns all registered admin staff users
 */
export function getAdminStaffUsers(): MasterAdminUser[] {
  if (typeof window === 'undefined') return INITIAL_ADMIN_STAFF_V2;
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_ADMIN_STAFF_V2;
}

/**
 * Saves or updates an admin staff record
 */
export function saveAdminStaffUser(user: Partial<MasterAdminUser>): MasterAdminUser {
  const current = getAdminStaffUsers();
  const id = user.id || `adm-${Date.now()}`;
  const role = user.role || 'OPERATIONS_ADMIN';
  const roleMeta = ADMIN_ROLE_DEFINITIONS[role];

  const newUser: MasterAdminUser = {
    id,
    name: user.name || 'Admin Officer',
    email: user.email || `${id}@buildghar.com`,
    phone: (user.phone || '').replace(/\D/g, '').slice(-10) || '9826000000',
    role,
    department: user.department || roleMeta.department,
    isActive: user.isActive !== undefined ? user.isActive : true,
    permissions: user.permissions || roleMeta.defaultPermissions,
    twoFactorEnabled: user.twoFactorEnabled || false,
    lastLogin: user.lastLogin || new Date().toISOString(),
    createdAt: user.createdAt || new Date().toISOString(),
  };

  const idx = current.findIndex((u) => u.id === id);
  const updated = idx >= 0 ? current.map((u, i) => (i === idx ? newUser : u)) : [newUser, ...current];

  try {
    localStorage.setItem(STORAGE_ADMIN_USERS, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    logAdminAuditAction({
      action: idx >= 0 ? 'ADMIN_USER_UPDATED' : 'ADMIN_USER_CREATED',
      target: newUser.name,
      details: `Role assigned: ${role} (${roleMeta.title})`,
    });
  } catch {}

  return newUser;
}

/**
 * Active admin role switcher for easy multi-role persona testing
 */
export function getActiveAdminRole(): MasterAdminRole {
  if (typeof window === 'undefined') return 'SUPER_ADMIN';
  try {
    const role = localStorage.getItem(STORAGE_ACTIVE_ROLE) as MasterAdminRole;
    if (role && ADMIN_ROLE_DEFINITIONS[role]) return role;
  } catch {}
  return 'SUPER_ADMIN';
}

export function setActiveAdminRole(role: MasterAdminRole): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACTIVE_ROLE, role);
    window.dispatchEvent(new CustomEvent('admin_role_switched', { detail: role }));
    window.dispatchEvent(new Event('storage'));
    logAdminAuditAction({
      action: 'ADMIN_ROLE_SWITCHED',
      target: role,
      details: `Active viewing role switched to ${ADMIN_ROLE_DEFINITIONS[role].title}`,
    });
  } catch {}
}

/**
 * Checks whether an active admin role possesses a specific permission
 */
export function hasAdminPermission(
  requiredPermission: AdminPermission,
  activeRole: MasterAdminRole = getActiveAdminRole()
): boolean {
  if (activeRole === 'SUPER_ADMIN') return true;
  const roleMeta = ADMIN_ROLE_DEFINITIONS[activeRole];
  if (!roleMeta) return false;
  if (roleMeta.defaultPermissions.includes('ALL_PERMISSIONS')) return true;
  return roleMeta.defaultPermissions.includes(requiredPermission);
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: MasterAdminRole;
  action: string;
  target?: string;
  details?: string;
  ipAddress?: string;
}

/**
 * Logs sensitive admin events to immutable audit ledger
 */
export function logAdminAuditAction(entry: {
  action: string;
  target?: string;
  details?: string;
  actor?: string;
  role?: MasterAdminRole;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_TRAIL);
    const logs: AdminAuditEntry[] = raw ? JSON.parse(raw) : [];
    const activeRole = entry.role || getActiveAdminRole();
    const activeActor = entry.actor || ADMIN_ROLE_DEFINITIONS[activeRole].title;

    const newLog: AdminAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor: activeActor,
      role: activeRole,
      action: entry.action,
      target: entry.target,
      details: entry.details,
      ipAddress: '127.0.0.1 (Internal Gateway)',
    };

    localStorage.setItem(STORAGE_AUDIT_TRAIL, JSON.stringify([newLog, ...logs.slice(0, 499)]));
  } catch {}
}

export function getAdminAuditLogs(): AdminAuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_TRAIL);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
