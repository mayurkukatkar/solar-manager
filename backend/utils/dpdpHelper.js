/**
 * DPDP (Digital Personal Data Protection Act, 2023) & Indian Legal Compliance Helpers
 * Enforces:
 * 1. UIDAI Aadhaar Masking Regulations (only last 4 digits visible)
 * 2. IT Act 2000 & DPDP Act 2023 Sensitive Personal Data Protection
 * 3. Section 5 Notice & Itemized Purpose Specification
 * 4. Section 6 Affirmative Consent Management
 * 5. Section 8 Data Retention & Statutory Hold Evaluation (CGST Act, CEA Grid Standards)
 * 6. Section 11, 12, 13, 14 Data Principal Rights (Access, Correction, Erasure, Grievance, Nomination)
 */

const prisma = require('../db');

// Statutory Itemized Processing Purposes under Section 5 & 6 DPDP Act 2023
const STATUTORY_DPDP_PURPOSES = [
  {
    code: 'FEASIBILITY_SIZING',
    title: 'Solar Feasibility & Engineering Sizing',
    description: 'Processing roof coordinates, shadow analysis, and historical electricity consumption to design optimized solar plant sizing.',
    category: 'TECHNICAL_ENGINEERING',
    isMandatoryForContract: true,
  },
  {
    code: 'DISCOM_NET_METERING',
    title: 'Statutory DISCOM Grid Interconnection & Net Metering',
    description: 'Submitting statutory connection application, Work Completion Report (WCR), test reports, and consumer details to state distribution utility (e.g. MSEDCL).',
    category: 'STATUTORY_FILING',
    isMandatoryForContract: true,
  },
  {
    code: 'PM_SURYA_GHAR_DBT',
    title: 'National Portal PM Surya Ghar DBT Subsidy Claim',
    description: 'Transmitting verified consumer number, bank account details, and installation geotags to MNRE National Portal for Direct Benefit Transfer disbursement.',
    category: 'GOVERNMENT_SUBSIDY',
    isMandatoryForContract: true,
  },
  {
    code: 'CONTRACT_INVOICING',
    title: 'Turnkey Solar EPC Contract & GST Tax Invoicing',
    description: 'Issuance of digitally signed EPC installation agreement and GST-compliant tax invoices as required under Central Goods and Services Tax Act 2017.',
    category: 'LEGAL_FINANCIAL',
    isMandatoryForContract: true,
  },
  {
    code: 'COMMUNICATION_UPDATES',
    title: 'Milestone Tracking & Warranty Alerts (WhatsApp/SMS)',
    description: 'Sending automated dispatch alerts, inspection appointments, generation reports, and bi-directional meter synchronization updates.',
    category: 'COMMUNICATION',
    isMandatoryForContract: false,
  },
  {
    code: 'FINANCING_LOAN',
    title: 'Solar Green Loan Appraisal & Banking Credit Evaluation',
    description: 'Sharing customer KYC, electricity bill history, and quotation with accredited green solar lending partners if loan financing is opted.',
    category: 'FINANCIAL_CREDIT',
    isMandatoryForContract: false,
  },
];

/**
 * Aadhaar Masking Utility (UIDAI Compliance)
 * Strictly masks first 8 digits: returns 'XXXX-XXXX-1234'
 */
function maskAadhaar(rawAadhaar) {
  if (!rawAadhaar) return null;
  const digits = String(rawAadhaar).replace(/[^0-9]/g, '');
  if (digits.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = digits.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * PAN Card Masking Utility (Income Tax / IT Act Compliance)
 * Masks first 5 characters: returns 'XXXXX1234F'
 */
function maskPan(rawPan) {
  if (!rawPan) return null;
  const pan = String(rawPan).trim().toUpperCase();
  if (pan.length === 10) {
    return `XXXXX${pan.slice(5)}`;
  }
  return 'XXXXX****';
}

/**
 * Bank Account Masking Utility
 * Masks all but last 4 digits: returns 'XXXXXXXX5678'
 */
function maskBankAccount(rawAccount) {
  if (!rawAccount) return null;
  const digits = String(rawAccount).replace(/[^0-9]/g, '');
  if (digits.length < 4) return 'XXXXXXXXXXXX';
  return `${'X'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

/**
 * Audit Logger for Personal Data Access / Transfer under DPDP Act Section 8
 */
async function logDPDPAccess(req, { action, entityType, entityId, details, targetDataPrincipal }) {
  try {
    const actorId = req?.user?.id || req?.user?.userId || 'SYSTEM';
    const tenantId = req?.user?.tenantId || details?.tenantId || null;
    const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        actorId,
        tenantId,
        action: `DPDP_${action}`,
        entity: entityType || 'DATA_PRINCIPAL',
        entityId: entityId || null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
        details: {
          ...details,
          targetDataPrincipal: targetDataPrincipal || undefined,
          timestamp: new Date().toISOString(),
          complianceStandard: 'DPDP_ACT_2023',
        },
      },
    });
  } catch (err) {
    console.warn('DPDP audit logging notice:', err.message);
  }
}

/**
 * Evaluate Statutory Retention Obligations (Section 8(7) DPDP Act)
 * Returns whether personal data can be completely erased or requires statutory retention.
 */
async function evaluateStatutoryRetentionHolds(tenantId, customerId, leadId) {
  const holds = [];

  if (customerId) {
    // 1. Tax & GST Retention Hold (Section 36 of CGST Act 2017 - 72 months / 6 years)
    const invoices = await prisma.invoice.findMany({
      where: { customerId, tenantId },
      select: { id: true, invoiceNumber: true, createdAt: true, amount: true, status: true },
    });

    if (invoices.length > 0) {
      holds.push({
        law: 'Central Goods and Services Tax (CGST) Act, 2017 (Section 36)',
        reason: 'Statutory mandate to retain books of account and tax invoices for at least 72 months from the due date of furnishing annual return.',
        affectedRecords: `Invoices: ${invoices.map((i) => i.invoiceNumber).join(', ')}`,
        canEraseMarketingData: true,
        canDeleteTaxInvoice: false,
      });
    }

    // 2. DISCOM Technical & Grid Interconnection Record (CEA Grid Standards 2013)
    const projects = await prisma.project.findMany({
      where: { customerId, tenantId },
      select: { id: true, projectNumber: true, currentStage: true, status: true, capacity: true },
    });

    if (projects.length > 0) {
      holds.push({
        law: 'Central Electricity Authority (Technical Standards for Connectivity of the Distributed Generation Resources) Regulations',
        reason: 'Mandatory technical equipment, bi-directional net-meter, and WCR documentation tracking for connected distributed solar generation.',
        affectedRecords: `Projects: ${projects.map((p) => p.projectNumber).join(', ')}`,
        canEraseMarketingData: true,
        canDeleteTechnicalSpecs: false,
      });
    }
  }

  return {
    hasStatutoryHolds: holds.length > 0,
    holds,
    allowAnonymization: true,
    allowFullDeletion: holds.length === 0,
  };
}

module.exports = {
  STATUTORY_DPDP_PURPOSES,
  maskAadhaar,
  maskPan,
  maskBankAccount,
  logDPDPAccess,
  evaluateStatutoryRetentionHolds,
};

