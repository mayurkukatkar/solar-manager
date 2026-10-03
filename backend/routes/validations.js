const { z } = require('zod');

// Super Admin
const createTenantSchema = z.object({
  name: z.string().min(2, "Company Name is required"),
  legalName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  adminName: z.string().min(2, "Admin Name is required"),
  adminEmail: z.string().email("Valid Admin Email is required"),
  planId: z.string().optional()
});

const createPlanSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL'])
});

// CRM / Leads
const createLeadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().min(10, "Valid mobile is required"),
  company: z.string().optional(),
  source: z.string().optional(),
  estimatedCap: z.number().optional()
});

// Inventory
const createProductSchema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().min(2, "Category is required"),
  sku: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().min(1),
  purchaseCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional()
});

// Task
const createTaskSchema = z.object({
  name: z.string().min(2, "Task name is required"),
  projectId: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  dueDate: z.string().optional().or(z.literal(''))
});

module.exports = {
  createTenantSchema,
  createPlanSchema,
  createLeadSchema,
  createProductSchema,
  createTaskSchema
};
