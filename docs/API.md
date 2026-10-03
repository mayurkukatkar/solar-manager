# Route Map & API Standards

## Frontend Routes (Solar Admin Panel)
- `/tenant/dashboard` - Main KPI Command Center
- `/tenant/leads` - Lead Management & Kanban
- `/tenant/crm` - Customer Directory
- `/tenant/surveys` - Site Surveys & Mobile Workflow
- `/tenant/quotations` - Quotation Builder
- `/tenant/projects` - Project Management & Gantt
- `/tenant/inventory` - Stock, Dispatch, Warehouses
- `/tenant/procurement` - Vendors, Purchase Orders
- `/tenant/finance` - Invoices, Payments, Expenses
- `/tenant/documents` - Centralized file storage
- `/tenant/service` - Support Tickets & AMC
- `/tenant/settings` - Company profile, users, automation

## Backend API Standards
All tenant-facing APIs will be prefixed with `/api/tenant/`.

### Consistent CRUD Pattern
- `GET /api/tenant/:module` (List with pagination/filters)
- `GET /api/tenant/:module/:id` (Detail)
- `POST /api/tenant/:module` (Create)
- `PATCH /api/tenant/:module/:id` (Update fields)
- `DELETE /api/tenant/:module/:id` (Archive/Delete)

### Workflow Actions (RPC Style)
- `POST /api/tenant/leads/:id/convert`
- `POST /api/tenant/quotations/:id/accept`
- `POST /api/tenant/inventory/dispatch`
- `POST /api/tenant/invoices/:id/pay`

### Security Guarantees
All `/api/tenant/*` routes must be protected by the `requireTenantAuth` middleware.
