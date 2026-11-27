/**
 * BuildGhar - Interior Designer Security & Role-Based Access Control (RBAC)
 * Specification: Section 20 (SECURITY AND ROLE-BASED ACCESS CONTROL) & Section 23 (Mandatory Test 8)
 *
 * Core Rule: Enforce strict backend validation for all Interior Designer actions.
 * Never rely solely on frontend routing.
 */

export interface SecurityActor {
  id: string;
  role: string;
  name?: string;
  phone?: string;
}

export type ProtectedResourceType =
  | 'PROFILE'
  | 'ASSIGNMENT'
  | 'PROJECT'
  | 'QUOTATION'
  | 'PAYOUT'
  | 'PAYMENT_COLLECTION'
  | 'INTERNAL_ADMIN_NOTE'
  | 'DESIGN_ASSET'
  | 'MILESTONE';

export type RestrictedActionType =
  | 'APPROVE_OWN_QUOTATION'
  | 'APPROVE_OWN_DESIGN'
  | 'APPROVE_OWN_MILESTONE'
  | 'CHANGE_CUSTOMER_PAYMENT_STATUS'
  | 'DISBURSE_OWN_PAYOUT'
  | 'DIRECT_UNMODERATED_MESSAGING'
  | 'ACCESS_INTERNAL_ADMIN_NOTES'
  | 'MODIFY_ACCEPTED_CONTRACT'
  | 'MODIFY_PAYMENT_SCHEDULE'
  | 'RECEIVE_NEW_ASSIGNMENT';

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: ProtectedResourceType;
  resourceId?: string;
  outcome: 'ALLOWED' | 'DENIED';
  reason?: string;
}

export class SecurityAccessDeniedError extends Error {
  public code: string;
  public actorId: string;
  public resourceType: string;

  constructor(message: string, code: string, actorId: string, resourceType: string) {
    super(message);
    this.name = 'SecurityAccessDeniedError';
    this.code = code;
    this.actorId = actorId;
    this.resourceType = resourceType;
  }
}

const STORAGE_KEYS = {
  SECURITY_AUDIT_LOG: 'gd_interior_security_audit_v1',
};

export const getSecurityAuditLogs = (): SecurityAuditEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY_AUDIT_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const recordSecurityAuditLog = (
  entry: Omit<SecurityAuditEntry, 'id' | 'timestamp'>
): SecurityAuditEntry => {
  const all = getSecurityAuditLogs();
  const newEntry: SecurityAuditEntry = {
    ...entry,
    id: `SEC-AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };

  all.unshift(newEntry);
  try {
    localStorage.setItem(STORAGE_KEYS.SECURITY_AUDIT_LOG, JSON.stringify(all));
  } catch (e) {}

  return newEntry;
};

/**
 * Section 20 Rule 1 to 4:
 * Validates whether an actor has ownership or administrative right to access a resource.
 */
export const validateInteriorDesignerAccess = (
  actor: SecurityActor,
  resource: {
    type: ProtectedResourceType;
    ownerDesignerId?: string;
    projectId?: string;
    resourceId?: string;
  }
): { allowed: boolean; reason?: string } => {
  // 1. Super Admin and authorized platform admins have master access
  if (
    actor.role === 'SUPER_ADMIN' ||
    actor.role === 'ADMIN' ||
    actor.role === 'OPERATIONS_ADMIN' ||
    actor.role === 'FINANCE_MANAGER'
  ) {
    return { allowed: true };
  }

  // 2. Interior Designer Role Checks
  if (actor.role === 'INTERIOR_DESIGNER' || actor.role === 'PROFESSIONAL') {
    // Cannot access internal admin notes under any circumstances
    if (resource.type === 'INTERNAL_ADMIN_NOTE') {
      const reason = 'Access Denied: Internal Admin Notes must never be visible to professionals or customers.';
      recordSecurityAuditLog({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'ACCESS_INTERNAL_NOTE',
        resourceType: 'INTERNAL_ADMIN_NOTE',
        resourceId: resource.resourceId,
        outcome: 'DENIED',
        reason,
      });
      return { allowed: false, reason };
    }

    // Cannot access customer payment collections
    if (resource.type === 'PAYMENT_COLLECTION') {
      const reason = 'Access Denied: Customer gateway collection records are restricted to BuildGhar Finance Admin.';
      recordSecurityAuditLog({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'ACCESS_CUSTOMER_PAYMENT',
        resourceType: 'PAYMENT_COLLECTION',
        resourceId: resource.resourceId,
        outcome: 'DENIED',
        reason,
      });
      return { allowed: false, reason };
    }

    // Must match ownerDesignerId for private resources
    if (resource.ownerDesignerId && resource.ownerDesignerId !== actor.id) {
      let resourceName = 'record';
      if (resource.type === 'PROJECT') resourceName = "another designer's project";
      if (resource.type === 'QUOTATION') resourceName = "another designer's quotation";
      if (resource.type === 'PAYOUT') resourceName = "another designer's earnings and payouts";
      if (resource.type === 'ASSIGNMENT') resourceName = "an assignment not assigned to you";
      if (resource.type === 'PROFILE') resourceName = "another designer's private profile";

      const reason = `Access Denied: You do not have permission to view or manage ${resourceName}.`;
      recordSecurityAuditLog({
        actorId: actor.id,
        actorRole: actor.role,
        action: `ACCESS_${resource.type}`,
        resourceType: resource.type,
        resourceId: resource.resourceId,
        outcome: 'DENIED',
        reason,
      });
      return { allowed: false, reason };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: 'Access Denied: Unrecognized actor role.' };
};

/**
 * Enforces resource access with an exception throw if denied.
 */
export const enforceResourceAccess = (
  actor: SecurityActor,
  resource: {
    type: ProtectedResourceType;
    ownerDesignerId?: string;
    projectId?: string;
    resourceId?: string;
  }
): void => {
  const check = validateInteriorDesignerAccess(actor, resource);
  if (!check.allowed) {
    throw new SecurityAccessDeniedError(
      check.reason || 'Security Access Denied',
      'FORBIDDEN_RESOURCE_ACCESS',
      actor.id,
      resource.type
    );
  }
};

/**
 * Section 20 Rule 5 to 13:
 * Enforces strict boundary checks on privileged administrative operations.
 */
export const checkDesignerActionPermission = (
  actorRole: string,
  action: RestrictedActionType,
  actorId?: string
): { allowed: boolean; reason?: string } => {
  const isAdmin =
    actorRole === 'SUPER_ADMIN' ||
    actorRole === 'ADMIN' ||
    actorRole === 'FINANCE_MANAGER' ||
    actorRole === 'PROJECT_MANAGER' ||
    actorRole === 'QUOTATION_MANAGER';

  switch (action) {
    case 'APPROVE_OWN_QUOTATION':
      if (!isAdmin) {
        return {
          allowed: false,
          reason: 'Access Denied: Interior Designer cannot approve their own quotation. Approval requires Central Admin verification.',
        };
      }
      return { allowed: true };

    case 'APPROVE_OWN_DESIGN':
      if (!isAdmin) {
        return {
          allowed: false,
          reason: 'Access Denied: Interior Designer cannot approve their own designs. Designs must be reviewed by Admin QA and Homeowner.',
        };
      }
      return { allowed: true };

    case 'APPROVE_OWN_MILESTONE':
      if (!isAdmin) {
        return {
          allowed: false,
          reason: 'Access Denied: Interior Designer cannot approve their own milestones. Requires verified evidence inspection.',
        };
      }
      return { allowed: true };

    case 'CHANGE_CUSTOMER_PAYMENT_STATUS':
      if (!isAdmin) {
        return {
          allowed: false,
          reason: 'Access Denied: Interior Designer cannot change customer payment status.',
        };
      }
      return { allowed: true };

    case 'DISBURSE_OWN_PAYOUT':
      if (!isAdmin) {
        return {
          allowed: false,
          reason: 'Access Denied: Interior Designer cannot process or disburse their own payout as Paid. Payouts require Admin Treasury authorization.',
        };
      }
      return { allowed: true };

    case 'DIRECT_UNMODERATED_MESSAGING':
      return {
        allowed: false,
        reason: 'Access Denied: Direct off-platform communication outside the Admin routing workflow is strictly restricted.',
      };

    case 'ACCESS_INTERNAL_ADMIN_NOTES':
      if (!isAdmin) {
        return {
          allowed: false,
          reason: 'Access Denied: Internal Admin Notes must never be visible to Customers or professionals.',
        };
      }
      return { allowed: true };

    case 'MODIFY_ACCEPTED_CONTRACT':
      return {
        allowed: false,
        reason: 'Access Denied: Interior Designer cannot modify an accepted quotation or contract without an authorized change order.',
      };

    case 'MODIFY_PAYMENT_SCHEDULE':
      return {
        allowed: false,
        reason: 'Access Denied: Interior Designer cannot modify the approved payment schedule without an authorized change order.',
      };

    case 'RECEIVE_NEW_ASSIGNMENT':
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Access Denied: Unrecognized action.' };
  }
};

/**
 * Enforces action permission with an exception throw if denied.
 */
export const enforceDesignerActionPermission = (
  actor: SecurityActor,
  action: RestrictedActionType
): void => {
  const check = checkDesignerActionPermission(actor.role, action, actor.id);
  if (!check.allowed) {
    recordSecurityAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action,
      resourceType: 'PROFILE',
      outcome: 'DENIED',
      reason: check.reason,
    });

    throw new SecurityAccessDeniedError(
      check.reason || 'Unauthorized security action attempt',
      'FORBIDDEN_ACTION_ATTEMPT',
      actor.id,
      action
    );
  }
};

/**
 * Section 20 Rule 14:
 * Suspended or unapproved accounts cannot receive new assignments.
 */
export const canReceiveAssignment = (
  accountStatus: string
): { allowed: boolean; reason?: string } => {
  if (accountStatus === 'APPROVED') {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Access Denied: Account status is ${accountStatus}. Suspended or unapproved accounts cannot receive new assignments.`,
  };
};