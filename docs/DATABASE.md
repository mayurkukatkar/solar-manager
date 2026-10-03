# Proposed Database ERD (Entity Relationship Diagram)

The current Prisma schema provides a strong foundation. Based on the master specification, here is the expanded logical structure for the Solar Admin ERP.

## Core Hierarchy
`Tenant` (Solar Company) -> `User` (Sub-Admins) -> `Role/Permissions`

## The CRM & Project Lifecycle (The Golden Thread)
Every entity is bound by `tenantId`.

1. **Leads**: Tracks prospective customers (Source, Status, Follow-ups).
2. **Customers**: Converted from Leads.
3. **Site Surveys**: Linked to Customers/Leads (Checklist, Roof Details, Photos).
4. **Quotations**: Proposed system capacity and pricing.
5. **Projects**: The core operational unit. Tracks installation stages.
6. **Procurement**: `Purchase Orders` & `Vendors` linked to Projects.
7. **Inventory**: `Warehouses`, `Products`, `Stock Movements`, `Serial Numbers`.
8. **Installation**: Linked to Projects (Team, Checklist).
9. **Finance**: `Invoices`, `Payments`, `Expenses` tied to Projects for profitability.
10. **Support**: `Tickets` and `Service Visits` (AMC).

## Key Relationships to Enforce
- A `Project` must reference the original `Lead` and `Customer`.
- An `Invoice` must reference the `Project`.
- A `Stock Movement` (Material Dispatch) must reference the `Project` and decrement `Stock Balance`.

*(Note: The current schema in `prisma/schema.prisma` already handles many of these relations. Phase 0 requires validating these models before proceeding to UI).*
