# Solar ERP - Permission Matrix & Security Architecture

## Roles
1. **SUPER_ADMIN**: Platform Owner. Has full access to `/super-admin` routes. No access to tenant data.
2. **TENANT_ADMIN**: Solar Company Owner. Has implicit full access to all data scoped to their `tenantId`.
3. **TENANT_SUB_ADMIN**: Employees. Access is strictly determined by a granular JSON permissions object.

## Granular Permission Structure
Permissions are stored as JSON on the `User` model for sub-admins.
Format: `module.action`

### Permission Matrix (Example)
- `leads.view`, `leads.create`, `leads.edit`, `leads.delete`, `leads.assign`
- `crm.view`, `crm.create`, `crm.edit`
- `surveys.view`, `surveys.create`, `surveys.edit`, `surveys.approve`
- `quotations.view`, `quotations.create`, `quotations.send`, `quotations.approve`
- `projects.view`, `projects.edit`, `projects.assign_tasks`
- `inventory.view`, `inventory.dispatch`, `inventory.receive`
- `finance.view`, `finance.create_invoice`, `finance.record_payment`
- `tickets.view`, `tickets.reply`, `tickets.resolve`

## Backend Enforcement (Critical Rule)
The frontend MUST NOT be the only layer hiding buttons. 
Every API endpoint MUST verify:
1. Valid JWT.
2. Extract `tenantId` from JWT.
3. Apply `where: { tenantId }` to Prisma queries.
4. If role is `TENANT_SUB_ADMIN`, check if `req.user.permissions.includes('module.action')`. If false, throw `403 Forbidden`.
