/**
 * WhereReady Solar OS — Role-Based Access Control (RBAC) Utility
 * Implements granular module.action permissions and role inheritance
 * conforming to docs/SECURITY.md and MASTER_ERP_SPECIFICATION.md.
 */
import { UserProfile } from '../types';

export type PermissionNamespace =
  | 'leads.view'
  | 'leads.create'
  | 'leads.edit'
  | 'leads.delete'
  | 'leads.assign'
  | 'crm.view'
  | 'crm.create'
  | 'crm.edit'
  | 'surveys.view'
  | 'surveys.create'
  | 'surveys.edit'
  | 'surveys.approve'
  | 'quotations.view'
  | 'quotations.create'
  | 'quotations.send'
  | 'quotations.approve'
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.assign_tasks'
  | 'inventory.view'
  | 'inventory.dispatch'
  | 'inventory.receive'
  | 'operations.view'
  | 'operations.scan'
  | 'hardware.scan'
  | 'finance.view'
  | 'finance.create_invoice'
  | 'finance.record_payment'
  | 'tickets.view'
  | 'tickets.reply'
  | 'tickets.resolve';

/**
 * Role Definitions with Implicit Full Access
 */
const UNRESTRICTED_ROLES = new Set(['SUPER_ADMIN', 'TENANT_ADMIN', 'OWNER']);

/**
 * Fallback Permissions for Legacy / Simplified Roles when permissions array is omitted
 */
const ROLE_FALLBACK_PERMISSIONS: Record<string, string[]> = {
  SALES_AGENT: [
    'leads.view',
    'leads.create',
    'leads.edit',
    'crm.view',
    'quotations.view',
    'quotations.create',
    'projects.view',
    'finance.view',
    'surveys.view',
  ],
  TECHNICIAN: [
    'projects.view',
    'projects.edit',
    'operations.view',
    'operations.scan',
    'hardware.scan',
    'surveys.view',
    'inventory.view',
  ],
  TENANT_SUB_ADMIN: [
    'leads.view',
    'projects.view',
    'finance.view',
    'operations.view',
    'quotations.view',
  ],
};

/**
 * Check if the current user holds the required permission(s).
 * @param user Current UserProfile
 * @param requiredPermission Single permission or array of permissions (OR logic: true if user has ANY)
 */
export function hasPermission(
  user: (UserProfile & { permissions?: string[] }) | null | undefined | any,
  requiredPermission: string | string[]
): boolean {
  if (!user) return false;

  const role = (user.role || '').toUpperCase();
  if (UNRESTRICTED_ROLES.has(role)) {
    return true;
  }

  // Determine effective permissions list
  let userPerms: string[] = [];
  if (Array.isArray(user.permissions)) {
    userPerms = user.permissions;
  } else if (Array.isArray(user.permissions?.modules)) {
    userPerms = user.permissions.modules;
  } else if (typeof user.permissions === 'string') {
    try {
      const parsed = JSON.parse(user.permissions);
      userPerms = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.modules)
          ? parsed.modules
          : [user.permissions];
    } catch {
      userPerms = user.permissions.includes(',')
        ? user.permissions.split(',').map((s: string) => s.trim())
        : [user.permissions.trim()];
    }
  } else {
    userPerms = ROLE_FALLBACK_PERMISSIONS[role] || [];
  }

  const normalizedUserPerms = userPerms
    .filter((p) => p !== null && p !== undefined)
    .map((p) => String(p).trim().toLowerCase());

  // Global wildcard check
  if (normalizedUserPerms.includes('*') || normalizedUserPerms.includes('all')) {
    return true;
  }

  const targets = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

  return targets.some((rawTarget) => {
    if (!rawTarget) return false;
    const target = String(rawTarget).trim().toLowerCase();

    // 1. Direct exact match
    if (normalizedUserPerms.includes(target)) return true;

    // 2. Action target check: target is 'mod.action' (e.g. 'quotations.view')
    if (target.includes('.')) {
      const [mod] = target.split('.');
      if (mod) {
        // Module wildcard grant: 'quotations.*' grants 'quotations.view'
        if (normalizedUserPerms.includes(`${mod}.*`)) {
          return true;
        }
        // Direct module grant: 'quotations' grants 'quotations.view'
        if (normalizedUserPerms.includes(mod)) {
          return true;
        }
      }
    } else {
      // 3. Module target check: target is 'quotations'
      // If user holds 'quotations.*' or any specific action 'quotations.<action>'
      if (normalizedUserPerms.includes(`${target}.*`)) {
        return true;
      }
      if (normalizedUserPerms.some((p) => p.startsWith(`${target}.`))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Check if user has ALL required permissions (AND logic)
 */
export function hasAllPermissions(
  user: (UserProfile & { permissions?: string[] }) | null | undefined | any,
  requiredPermissions: string[]
): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  if (UNRESTRICTED_ROLES.has(role)) return true;

  return requiredPermissions.every((perm) => hasPermission(user, perm));
}
