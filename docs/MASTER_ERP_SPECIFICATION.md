# SOLAR ERP — COMPLETE APPLICATION USER STORIES

## 1. PURPOSE OF THE APPLICATION

Build a multi-tenant Solar ERP SaaS platform for solar installation companies.

The application should manage the complete business lifecycle:

**Lead → Customer → Site Survey → Quotation → Deal → Project → Procurement → Inventory → Installation → Invoice → Payment → Subsidy/Loan → Completion/Handover → Service/AMC**

All modules must be connected. The same customer must remain traceable throughout the entire lifecycle. Do not create disconnected duplicate customer records.

A project must be traceable back to the original lead, customer, site survey, quotation, purchased materials, installation, invoices, payments, documents and service history.

---

# 2. USER TYPES

The application has ONLY THREE SYSTEM ROLES.

### 2.1 Super Admin
The owner/operator of the Solar ERP SaaS platform. Manages Tenants, Subscriptions, Plans, Platform configuration.

### 2.2 Tenant Admin
The owner/admin of a solar company using the SaaS. Has complete control over their own tenant/company.

### 2.3 Tenant Sub-Admin
A normal employee/user inside the tenant.
There are no fixed department roles such as Sales Manager, Finance Manager, Inventory Manager or Technician.
Instead, every Tenant Sub-Admin receives granular permissions from the Tenant Admin.

---

# 3. SUPER ADMIN USER STORIES
(See original specification for full details)

# 4. TENANT MANAGEMENT
(See original specification for full details)

# 41. PERMISSION ARCHITECTURE
Use only these system roles:
SUPER_ADMIN
TENANT_ADMIN
TENANT_SUB_ADMIN

For Tenant Sub-Admins, permissions are module/action based.
(View, Create, Edit, Delete, Assign, Approve, Export, Send, Complete)

# 43. DATABASE PRINCIPLE
Every tenant-owned business record must be associated with the correct tenant.
Core entities include:
* tenants
* users
* permissions
* leads
* customers
* site_surveys
* products
* warehouses
* stock_movements
* serial_numbers
* vendors
* purchase_orders
* quotations
* projects
* project_tasks
* installations
* invoices
* payments
* expenses
* subsidy_applications
* loan_applications
* documents
* tickets
* amcs
* employees
* attendance
* automation_rules
* notifications
* audit_logs

# 44. ANTIGRAVITY IMPLEMENTATION RULE
Do not implement this application as a collection of mock screens.
For every production feature:
Database → Migration → Backend Service → API → Authorization → UI → Validation → Error Handling → Audit → Tests
