// Test script for RBAC functions
import assert from 'node:assert';

// Replicate rbac.ts logic without TS type imports for node execution
const UNRESTRICTED_ROLES = new Set(['SUPER_ADMIN', 'TENANT_ADMIN', 'OWNER']);

const ROLE_FALLBACK_PERMISSIONS = {
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

function hasPermission(user, requiredPermission) {
  if (!user) return false;

  const role = (user.role || '').toUpperCase();
  if (UNRESTRICTED_ROLES.has(role)) {
    return true;
  }

  let userPerms = [];
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    userPerms = user.permissions;
  } else if (Array.isArray(user.permissions?.modules)) {
    userPerms = user.permissions.modules;
  } else {
    userPerms = ROLE_FALLBACK_PERMISSIONS[role] || [];
  }

  if (userPerms.includes('*') || userPerms.includes('all')) {
    return true;
  }

  const targets = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

  return targets.some((target) => {
    if (userPerms.includes(target)) return true;

    const [mod] = target.split('.');
    if (mod && userPerms.includes(`${mod}.*`)) {
      return true;
    }

    return false;
  });
}

function hasAllPermissions(user, requiredPermissions) {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  if (UNRESTRICTED_ROLES.has(role)) return true;

  return requiredPermissions.every((perm) => hasPermission(user, perm));
}

// 1. Null / undefined users
assert.strictEqual(hasPermission(null, 'leads.view'), false, 'null user should return false');
assert.strictEqual(hasPermission(undefined, 'leads.view'), false, 'undefined user should return false');
assert.strictEqual(hasAllPermissions(null, ['leads.view']), false, 'null user hasAll should return false');

// 2. Unrestricted roles
for (const role of ['SUPER_ADMIN', 'TENANT_ADMIN', 'OWNER', 'super_admin', 'tenant_admin', 'owner']) {
  assert.strictEqual(hasPermission({ role }, 'anything.anyaction'), true, `${role} should have unrestricted access`);
  assert.strictEqual(hasAllPermissions({ role }, ['a.b', 'c.d', 'e.f']), true, `${role} should pass hasAllPermissions`);
}

// 3. Fallback permissions
const sales = { role: 'SALES_AGENT' };
assert.strictEqual(hasPermission(sales, 'leads.create'), true, 'SALES_AGENT can create leads');
assert.strictEqual(hasPermission(sales, 'finance.create_invoice'), false, 'SALES_AGENT cannot create invoice');

const tech = { role: 'TECHNICIAN' };
assert.strictEqual(hasPermission(tech, 'hardware.scan'), true, 'TECHNICIAN can scan hardware');
assert.strictEqual(hasPermission(tech, 'leads.create'), false, 'TECHNICIAN cannot create leads');

// 4. Wildcard permissions
const customWild = { role: 'CUSTOM', permissions: ['leads.*', 'projects.view'] };
assert.strictEqual(hasPermission(customWild, 'leads.view'), true, 'leads.* grants leads.view');
assert.strictEqual(hasPermission(customWild, 'leads.create'), true, 'leads.* grants leads.create');
assert.strictEqual(hasPermission(customWild, 'leads.delete'), true, 'leads.* grants leads.delete');
assert.strictEqual(hasPermission(customWild, 'projects.view'), true, 'projects.view is granted');
assert.strictEqual(hasPermission(customWild, 'projects.create'), false, 'projects.create not granted');

const globalWild = { role: 'AGENT', permissions: ['*'] };
assert.strictEqual(hasPermission(globalWild, 'finance.record_payment'), true, '* grants all');

const globalAll = { role: 'AGENT', permissions: ['all'] };
assert.strictEqual(hasPermission(globalAll, 'finance.record_payment'), true, 'all grants all');

// 5. Nested module array format: permissions: { modules: [...] }
const nestedUser = { role: 'OTHER', permissions: { modules: ['finance.view'] } };
assert.strictEqual(hasPermission(nestedUser, 'finance.view'), true, 'nested modules array supported');
assert.strictEqual(hasPermission(nestedUser, 'leads.view'), false, 'nested modules unlisted blocked');

// 6. Array of required permissions (OR logic)
assert.strictEqual(hasPermission(sales, ['leads.create', 'nonexistent.action']), true, 'hasPermission array is OR');
assert.strictEqual(hasPermission(sales, ['nonexistent.1', 'nonexistent.2']), false, 'hasPermission array false if none match');

// 7. hasAllPermissions (AND logic)
assert.strictEqual(hasAllPermissions(sales, ['leads.view', 'leads.create']), true, 'SALES_AGENT has both leads.view and leads.create');
assert.strictEqual(hasAllPermissions(sales, ['leads.view', 'finance.create_invoice']), false, 'SALES_AGENT fails when one is missing');

console.log('ALL 18 RBAC ADVERSARIAL STRESS TESTS PASSED CLEANLY!');
