# Solar ERP - Architecture Assessment & Assessment

## Current Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React.
- **Backend**: Node.js, Express, Prisma ORM.
- **Database**: PostgreSQL (Supabase).
- **Authentication**: JWT via HttpOnly Cookies, bcrypt password hashing.

## Reusable Components & Infrastructure
- The `super-admin` frontend module has working sidebar/header layouts and dashboard cards that can be adapted for the Tenant interface.
- Backend has a functional Prisma schema handling auth, tenant creation, and email provisioning.
- Node.js Express server (`server.js`) is stable with structured routing.

## Missing Functionality (Phase 0)
- **Tenant Context Isolation**: The current `requireSuperAdmin` middleware is hardcoded to Super Admins. A new `requireTenantAuth` middleware must be written to resolve `req.user.tenantId` for every request.
- **Granular RBAC**: The user table has roles (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_SUB_ADMIN`), but Sub-Admin JSON permissions are not yet enforced in the backend.
- **Audit Logging Middleware**: Changes made by users need to automatically write to the `AuditLog` table.
- **Storage/Documents**: Currently missing a file storage solution for documents and photos.

## Risks Identified
- **Data Leakage**: The biggest risk in multi-tenant systems. All tenant queries MUST include `where: { tenantId: req.user.tenantId }`. Failing to include this in even one API will expose another company's data.
- **Cookie Overwrite**: The `login` API currently issues a generic `super_admin_token` for everyone. We must issue a distinct `tenant_token` for Solar Admins to avoid session overlap.
- **Frontend Monolith**: Mixing Super Admin and Tenant Admin routes without strict layout isolation can lead to UI bugs.
