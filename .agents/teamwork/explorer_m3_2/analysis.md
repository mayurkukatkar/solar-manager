# CRM, Pipeline & Quotation Architecture Analysis (Milestone M3)

## Executive Summary
This document provides the complete architectural audit, gap analysis, and implementation blueprint for the CRM, Lead Capture, Quick Quote Sizing Engine, Dynamic Quotation Builder, and Customer Onboarding modules in `mobile-app/src/screens/crm/`.

Currently, while these screens contain functional baseline flows, they suffer from:
1. **Pipeline Kanban fragmentation**: `PipelineScreen.tsx` groups leads into 5 arbitrary non-standard buckets (`ALL`, `LEADS`, `QUOTES`, `ONBOARDING`, `PROJECTS`) rather than the canonical 7-stage solar EPC pipeline (`NEW`, `CONTACTED`, `SITE_SURVEY`, `QUOTATION_SENT`, `NEGOTIATION`, `WON`, `LOST`).
2. **Ergonomic & Touch Target Violations**: Lead cards utilize sub-standard touch targets (e.g. `microCircleBtn` at 34x34 dp, violating the 48x48 dp minimum standard), hardcoded color tokens lacking dark theme support, and non-virtualized `ScrollView.map()` list rendering.
3. **Keyboard Obstruction & Zero Unsaved Changes Protection**: `LeadCaptureModal.tsx`, `QuotationBuilderModal.tsx`, and `CustomerOnboardingModal.tsx` wrap entire forms in standard `ScrollView` within raw `Modal`, resulting in keyboard occlusion of form inputs and buttons, and lack dirty form guards (`useDirtyFormWarning`), risking catastrophic data loss upon accidental Android back button presses.
4. **Opaque Pricing & Missing Statutory Composite GST**: Quotation building currently forces a single lumpsum cost without an itemized dynamic Bill of Materials (BOM) breakdown (Modules, Inverter, Structure, BOS, Installation), and does not transparently itemize the statutory Indian 13.8% composite solar GST split (70% Goods @ 12% + 30% Services @ 18%).
5. **Monolithic Onboarding**: `CustomerOnboardingModal.tsx` presents a single 5-section vertical scrollview instead of an ergonomic multi-step wizard, lacking structured Aadhaar, PAN, and IFSC validations.

---

## 1. Pipeline & CRM Lead Management (`PipelineScreen.tsx`)

### 1.1 Canonical Kanban Stage Filter Chips
In `PipelineScreen.tsx` (lines 53-59), stages are currently defined as:
```typescript
// CURRENT (NON-CANONICAL BUCKETS)
const STAGES = [
  { id: 'ALL', label: 'All Records' },
  { id: 'LEADS', label: '1. New Leads' },
  { id: 'QUOTES', label: '2. Quotes Sent' },
  { id: 'ONBOARDING', label: '3. KYC Pending' },
  { id: 'PROJECTS', label: '4. Converted' },
];
```
This fails to reflect real-world solar EPC sales operations where leads move through clear gatekeeping stages.

#### Canonical Stage Architecture
```typescript
export type LeadStage =
  | 'ALL'
  | 'NEW'
  | 'CONTACTED'
  | 'SITE_SURVEY'
  | 'QUOTATION_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export const PIPELINE_STAGES: { id: LeadStage; label: string; badgeVariant: BadgeVariant }[] = [
  { id: 'ALL', label: 'All Deals', badgeVariant: 'neutral' },
  { id: 'NEW', label: '1. New Lead', badgeVariant: 'primary' },
  { id: 'CONTACTED', label: '2. Contacted', badgeVariant: 'info' },
  { id: 'SITE_SURVEY', label: '3. Site Survey', badgeVariant: 'purple' },
  { id: 'QUOTATION_SENT', label: '4. Quote Sent', badgeVariant: 'accent' },
  { id: 'NEGOTIATION', label: '5. Negotiation', badgeVariant: 'warning' },
  { id: 'WON', label: '6. Won / EPC', badgeVariant: 'success' },
  { id: 'LOST', label: '7. Lost / Closed', badgeVariant: 'danger' },
];
```

#### Filtering Logic
```typescript
const filteredItems = useMemo(() => {
  return leads.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.mobile || item.phone || '').includes(q) ||
      (item.city || '').toLowerCase().includes(q) ||
      (item.consumerNumber || '').includes(q);

    if (!matchesSearch) return false;
    if (activeStage === 'ALL') return true;
    
    const stage = (item.stage || item.status || 'NEW').toUpperCase();
    if (activeStage === 'NEW') return stage === 'NEW' || stage === 'DRAFT' || item.isDraft;
    if (activeStage === 'CONTACTED') return stage === 'CONTACTED';
    if (activeStage === 'SITE_SURVEY') return stage === 'SITE_SURVEY' || stage === 'SURVEY';
    if (activeStage === 'QUOTATION_SENT') return stage === 'QUOTATION_SENT' || stage === 'PROPOSAL_SENT';
    if (activeStage === 'NEGOTIATION') return stage === 'NEGOTIATION' || stage === 'QUALIFIED';
    if (activeStage === 'WON') return stage === 'WON' || stage === 'CONVERTED' || stage === 'COMPLETED';
    if (activeStage === 'LOST') return stage === 'LOST' || stage === 'DROPPED';
    return true;
  });
}, [leads, searchQuery, activeStage]);
```

### 1.2 Lead Card Density & Touch Target Standard
- **Violation in line 1723**: `microCircleBtn` has `width: 34, height: 34`.
  - Fix: Increase button dimensions to minimum 44x44 or 48x48 dp:
    ```typescript
    microCircleBtn: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    }
    ```
- **Action Buttons (`actionBtnWon`, `actionBtnQuote`, `actionBtnOnboard`)**:
  - Add `minHeight: touchTarget.min` (48dp) and replace raw inline styling with the standardized `Button` primitive (`size="sm"` with `hitSlop`).
- **Standardized Badge**:
  - Replace raw Views (lines 540-544) with `<Badge label={stageLabel} variant={stageVariant} size="sm" dot />`.
- **Primary Stage-Gated Action Button**:
  - `NEW` / `CONTACTED` -> `<Button title="Create Quote" variant="primary" size="sm" icon={<Zap size={14} />} />`
  - `SITE_SURVEY` / `QUOTATION_SENT` / `NEGOTIATION` -> `<Button title="Onboard Client" variant="success" size="sm" icon={<ShieldCheck size={14} />} />`
  - `WON` -> `<Button title="DISCOM Docs" variant="solar" size="sm" icon={<Building size={14} />} />`

### 1.3 State Handling & Virtualization
- **Loading State**:
  - Replace raw `ActivityIndicator` (lines 440-444) with `<SkeletonLoader.Card />` repeated 3 times.
- **Empty State**:
  - Replace raw `emptyContainer` (lines 445-462) with:
    ```tsx
    <EmptyState
      icon={<Layers size={36} color={colors.textSecondary} />}
      title={activeStage === 'ALL' ? 'No Leads in Pipeline' : `No Leads in ${activeStage}`}
      description="Capture a new prospect or scan a physical electricity bill to start closing solar deals."
      actionTitle="+ Add New Prospect"
      onActionPress={handleOpenLeadCapture}
    />
    ```
- **Virtualization**:
  - Replace `<ScrollView>{filteredItems.map(...)}</ScrollView>` with `<FlatList data={filteredItems} renderItem={renderLeadCard} keyExtractor={(item) => item.id} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} />`.

---

## 2. Lead Capture Form (`LeadCaptureModal.tsx`)

### 2.1 Keyboard Handling Architecture
Currently, `LeadCaptureModal` uses raw `Modal` + `ScrollView`, causing inputs at the bottom (monthly units, bill, DISCOM, and file attachments) to be completely obscured by Android and iOS virtual keyboards.

**Architectural Fix**: Wrap modal body in `KeyboardAvoidingContainer`:
```tsx
<Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleGuardedClose}>
  <KeyboardAvoidingContainer
    header={
      <ModalHeader
        title="New Solar Lead"
        subtitle="Direct field entry & prospect registration"
        onClose={handleGuardedClose}
        isDirty={isDirty}
      />
    }
    footer={
      <View style={styles.bottomBar}>
        <Button
          title="Save Lead"
          variant="secondary"
          onPress={() => handleSubmit(false)}
          loading={submitting}
          style={{ flex: 1 }}
        />
        <Button
          title="Create Proposal"
          variant="primary"
          onPress={() => handleSubmit(true)}
          loading={submitting}
          icon={<ArrowRight size={16} color={colors.white} />}
          iconPosition="right"
          style={{ flex: 1.5 }}
        />
      </View>
    }
  >
    {/* Form contents */}
  </KeyboardAvoidingContainer>
</Modal>
```

### 2.2 Unsaved Changes Guard
```typescript
const isDirty = useMemo(() => {
  return Boolean(
    name.trim() ||
    mobile.trim() ||
    altPhone.trim() ||
    address.trim() ||
    city.trim() ||
    pincode.trim() ||
    consumerNumber.trim() ||
    monthlyBill.trim() ||
    monthlyUnits.trim() ||
    billAttachmentUri
  );
}, [name, mobile, altPhone, address, city, pincode, consumerNumber, monthlyBill, monthlyUnits, billAttachmentUri]);

const handleGuardedClose = useDirtyFormWarning(
  isDirty,
  onClose,
  'Discard Lead Entry?',
  'You have unsaved customer details. Are you sure you want to discard this lead?'
);
```

### 2.3 Form Ergonomics & Validations
1. **Customer Legal Name**: Required, minimum 3 characters.
2. **Primary Mobile**: `keyboardType="phone-pad"`, `maxLength={10}`. Validated with regex `/^[6-9]\d{9}$/`.
3. **PIN Code**: `keyboardType="numeric"`, `maxLength={6}`. Validated with regex `/^[1-9][0-9]{5}$/`.
4. **Consumer Number**: `keyboardType="numeric"`, `maxLength={16}`. Auto-infers BU (first 4 digits) for 12-digit MSEDCL numbers.
5. **Source Attribution**:
   Selection chip group: `['Field App', 'Referral', 'Canopy / Stall', 'Social Media', 'Inbound Call', 'Channel Partner', 'Website']`.

---

## 3. Quick Quote Sizing Engine (`QuickQuoteScreen.tsx`)

### 3.1 Dynamic ALMM Solar Module Database
Ensure standard options include Tier-1 DCR ALMM modules with exact wattages:
```typescript
export const ALMM_MODULE_DATABASE: DynamicGearItem[] = [
  {
    id: 'waaree_540',
    name: 'Waaree 540W Mono PERC Bifacial',
    brand: 'Waaree',
    wattage: 540,
    subtitle: '25 Years Performance Warranty • ALMM / DCR Listed',
    tag: 'DCR Tier-1',
  },
  {
    id: 'adani_545',
    name: 'Adani 545W TopCon DCR Bifacial',
    brand: 'Adani Solar',
    wattage: 545,
    subtitle: 'N-Type TOPCon Cells • 30 Years Linear Warranty',
    tag: 'N-Type TOPCon',
  },
  {
    id: 'tata_545',
    name: 'Tata Power 545W Mono PERC DCR',
    brand: 'Tata Power Solar',
    wattage: 545,
    subtitle: 'Tier-1 High Reliability • DCR Compliant',
    tag: 'Tata Tier-1',
  },
  {
    id: 'vikram_550',
    name: 'Vikram Solar 550W Somera DCR',
    brand: 'Vikram Solar',
    wattage: 550,
    subtitle: 'High Power Output • Multi-Busbar Technology',
    tag: '550W TOPCon',
  },
  {
    id: 'goldi_545',
    name: 'Goldi 545W Heloc Plus Mono Bifacial',
    brand: 'Goldi Solar',
    wattage: 545,
    subtitle: 'MBB High Yield • Low Degradation',
    tag: 'MBB Tech',
  },
  {
    id: 'premier_545',
    name: 'Premier Energies 545W DCR Bifacial',
    brand: 'Premier Energies',
    wattage: 545,
    subtitle: 'DCR Cell & Module • High Temp Tolerance',
    tag: 'DCR Compliant',
  },
  {
    id: 'rayzon_545',
    name: 'Rayzon 545W Mono PERC Bifacial',
    brand: 'Rayzon Solar',
    wattage: 545,
    subtitle: 'MNRE / ALMM Approved • Indian Manufacturing',
    tag: 'ALMM Listed',
  },
];
```

### 3.2 Sizing Calculation: Monthly Bill vs Sanctioned Load
Under Indian DISCOM grid connectivity rules (e.g. MSEDCL, Torrent, Tata Power, BESCOM), solar capacity cannot exceed 100% of the Sanctioned Load.

**Algorithm**:
```typescript
interface SizingEngineInputs {
  monthlyBill: number;
  sanctionedLoadKw?: number;
  tariffPerUnit?: number; // default 8.5
  unitsPerKwMonth?: number; // default 120
}

interface SizingRecommendation {
  recommendedKwByBill: number;
  cappedKwBySanctionedLoad: number;
  finalRecommendedKw: number;
  requiresLoadEnhancement: boolean;
  suggestedEnhancementKw: number;
  estimatedMonthlyUnits: number;
  estimatedMonthlySavings: number;
  benchmarkGrossCost: number;
  cfaSubsidy: number;
  netPayable: number;
  paybackYears: number;
}

export function computeSolarSizing({
  monthlyBill,
  sanctionedLoadKw,
  tariffPerUnit = 8.5,
  unitsPerKwMonth = 120,
}: SizingEngineInputs): SizingRecommendation {
  const units = Math.max(0, monthlyBill / tariffPerUnit);
  const rawCapByBill = units / unitsPerKwMonth;
  const recommendedKwByBill = Number(Math.max(1, Math.min(25, rawCapByBill)).toFixed(1));

  let finalRecommendedKw = recommendedKwByBill;
  let requiresLoadEnhancement = false;
  let suggestedEnhancementKw = 0;
  const cappedKwBySanctionedLoad = sanctionedLoadKw || recommendedKwByBill;

  if (sanctionedLoadKw && sanctionedLoadKw > 0) {
    if (recommendedKwByBill > sanctionedLoadKw) {
      requiresLoadEnhancement = true;
      suggestedEnhancementKw = Number((recommendedKwByBill - sanctionedLoadKw).toFixed(1));
    }
  }

  // Tiered benchmark pricing per Watt/kW in India
  let ratePerKw = 58000;
  if (finalRecommendedKw <= 2) ratePerKw = 62000;
  else if (finalRecommendedKw <= 3) ratePerKw = 57000;
  else if (finalRecommendedKw <= 5) ratePerKw = 53000;
  else if (finalRecommendedKw <= 10) ratePerKw = 48000;
  else ratePerKw = 44000;

  const benchmarkGrossCost = Math.round(finalRecommendedKw * ratePerKw);

  // PM Surya Ghar Central DBT Subsidy
  let cfaSubsidy = 0;
  if (finalRecommendedKw >= 3) cfaSubsidy = 78000;
  else if (finalRecommendedKw >= 2) cfaSubsidy = 60000;
  else if (finalRecommendedKw >= 1) cfaSubsidy = 30000;

  const netPayable = Math.max(0, benchmarkGrossCost - cfaSubsidy);
  const estimatedMonthlyUnits = Math.round(finalRecommendedKw * unitsPerKwMonth);
  const estimatedMonthlySavings = Math.round(estimatedMonthlyUnits * tariffPerUnit);
  const annualSavings = estimatedMonthlySavings * 12;
  const paybackYears = annualSavings > 0 ? Number((netPayable / annualSavings).toFixed(1)) : 3.5;

  return {
    recommendedKwByBill,
    cappedKwBySanctionedLoad,
    finalRecommendedKw,
    requiresLoadEnhancement,
    suggestedEnhancementKw,
    estimatedMonthlyUnits,
    estimatedMonthlySavings,
    benchmarkGrossCost,
    cfaSubsidy,
    netPayable,
    paybackYears,
  };
}
```

---

## 4. Dynamic Quotation Builder (`QuotationBuilderModal.tsx`)

### 4.1 Dynamic Bill of Materials (BOM) Breakdown
Instead of a single raw number input for total cost, provide an itemized Bill of Materials:
1. **Solar PV Modules**:
   - `panelCount = Math.ceil((capacityKw * 1000) / panelWattage)`
   - Cost: `panelCount * panelWattage * ratePerWatt` (default ~₹24/Wp)
2. **Solar Inverter**:
   - Rated for capacity (e.g. 3.3kW / 5kW string inverter)
   - Cost: ~₹26,000 (3kW), ~₹38,000 (5kW)
3. **Mounting Structure**:
   - HDG GI Elevated Structure (~₹6,000/kWp)
4. **Balance of System (BOS)**:
   - ACDB, DCDB with Type-II SPD, 4/6 sq.mm solar DC cables, conduit pipes, chemical earthing pits (3 pits), lightning arrester (~₹5,500/kWp)
5. **EPC Installation, Testing & DISCOM Liaisoning**:
   - Civil works, mechanical installation, electrical testing, DISCOM net-metering liaison (~₹6,500/kWp)

### 4.2 Statutory 13.8% Composite Solar GST Formula
Under statutory Indian GST Council Notification No. 11/2017-CT(Rate) & 8/2021-CT(Rate):
- **Deemed Supply of Goods**: 70% of gross contract value, taxable @ 12% GST
- **Deemed Supply of Services**: 30% of gross contract value, taxable @ 18% GST
- **Effective GST Rate**: `(0.70 × 12%) + (0.30 × 18%) = 8.4% + 5.4% = 13.8%`

```typescript
export interface StatutoryGstBreakdown {
  taxableSubtotal: number;
  goodsValueDeemed: number;       // 70% of taxableSubtotal
  servicesValueDeemed: number;    // 30% of taxableSubtotal
  goodsGstAmount: number;         // goodsValueDeemed * 0.12 (6% CGST + 6% SGST)
  servicesGstAmount: number;      // servicesValueDeemed * 0.18 (9% CGST + 9% SGST)
  totalCompositeGst: number;      // goodsGstAmount + servicesGstAmount (= 13.8% of subtotal)
  grossTurnkeyCost: number;       // taxableSubtotal + totalCompositeGst
  cfaDbtSubsidy: number;          // ₹30,000 / ₹60,000 / ₹78,000
  netPayableByCustomer: number;   // grossTurnkeyCost - cfaDbtSubsidy
}

export function calculateCompositeSolarGst(taxableSubtotal: number, capacityKw: number): StatutoryGstBreakdown {
  const goodsValueDeemed = Math.round(taxableSubtotal * 0.70);
  const servicesValueDeemed = taxableSubtotal - goodsValueDeemed; // exactly 30%

  const goodsGstAmount = Math.round(goodsValueDeemed * 0.12);
  const servicesGstAmount = Math.round(servicesValueDeemed * 0.18);
  const totalCompositeGst = goodsGstAmount + servicesGstAmount;

  const grossTurnkeyCost = taxableSubtotal + totalCompositeGst;

  const cfaDbtSubsidy = capacityKw >= 3 ? 78000 : capacityKw >= 2 ? 60000 : capacityKw >= 1 ? 30000 : 0;
  const netPayableByCustomer = Math.max(0, grossTurnkeyCost - cfaDbtSubsidy);

  return {
    taxableSubtotal,
    goodsValueDeemed,
    servicesValueDeemed,
    goodsGstAmount,
    servicesGstAmount,
    totalCompositeGst,
    grossTurnkeyCost,
    cfaDbtSubsidy,
    netPayableByCustomer,
  };
}
```

---

## 5. Customer Onboarding Wizard (`CustomerOnboardingModal.tsx`)

### 5.1 4-Step Guided Stepper Workflow
Rather than one giant scroll, structure into 4 sequential steps with progress indicators:
- **Step 1: Customer Personal & Legal Profile**
  - Legal Full Name (matching electricity bill & Aadhaar)
  - 10-digit Mobile Number
  - Email (optional)
  - Installation Site Address, City, 6-digit PIN code
- **Step 2: Roof & Technical Feasibility**
  - Proposed Capacity (kWp)
  - Roof Construction Type (RCC Flat, Industrial Shed, Tile/Sloped)
  - Usable Roof Area (Sq. Ft)
  - Building Height / Floors
  - Shadow-Free Roof Confirmation
- **Step 3: KYC Identity Verification**
  - Aadhaar Number (12-digit format with spaces `XXXX XXXX XXXX`)
  - PAN Number (10 alphanumeric chars `[A-Z]{5}[0-9]{4}[A-Z]{1}`)
  - Document Upload Slots: Electricity Bill, Aadhaar Card, PAN Card, Roof Photos
- **Step 4: DISCOM Connection & DBT Bank Account**
  - **DISCOM Consumer Account Number** (COMPULSORY! Must be >= 6 chars)
  - Utility DISCOM Provider (e.g. MSEDCL, Tata Power, Torrent, Adani, BESCOM)
  - Beneficiary Account Holder Name
  - Bank Name & Account Number (9-18 digits)
  - IFSC Code (`^[A-Z]{4}0[A-Z0-9]{6}$`)
  - Booking Token Advance (Amount, Payment Mode, UTR/Transaction Ref)
  - Primary CTA: "Convert to Client & Provision Project"

### 5.2 Mandatory Validations & Error Trapping
```typescript
export function validateOnboardingStep(step: number, data: any): { valid: boolean; error?: string } {
  if (step === 1) {
    if (!data.legalName?.trim()) return { valid: false, error: 'Customer Legal Name is required' };
    const cleanMobile = (data.mobile || '').replace(/[^0-9]/g, '');
    if (cleanMobile.length !== 10) return { valid: false, error: 'Valid 10-digit mobile number required' };
    if (!data.address?.trim()) return { valid: false, error: 'Installation site address is required' };
    if (data.pincode && !/^[1-9][0-9]{5}$/.test(data.pincode.trim())) {
      return { valid: false, error: 'Enter a valid 6-digit Indian PIN code' };
    }
  }
  if (step === 3) {
    if (data.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan.trim().toUpperCase())) {
      return { valid: false, error: 'Enter a valid 10-character PAN (e.g. ABCDE1234F)' };
    }
    if (data.aadhaar) {
      const cleanAadhaar = data.aadhaar.replace(/[^0-9]/g, '');
      if (cleanAadhaar.length !== 12) {
        return { valid: false, error: 'Aadhaar number must be exactly 12 digits' };
      }
    }
  }
  if (step === 4) {
    const cleanConsumer = (data.consumerNumber || '').trim();
    if (!cleanConsumer) return { valid: false, error: 'DISCOM Consumer Number is compulsory' };
    if (cleanConsumer.length < 6) return { valid: false, error: 'Consumer Number must be at least 6 digits' };
    if (data.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode.trim().toUpperCase())) {
      return { valid: false, error: 'Enter a valid 11-character IFSC code (e.g. HDFC0001234)' };
    }
  }
  return { valid: true };
}
```

---

## 6. Implementation Blueprint for Worker M3

### Summary of Targeted File Changes
| File Path | Lines | Key Enhancements |
|---|---|---|
| `mobile-app/src/screens/crm/PipelineScreen.tsx` | 53-1250 | Canonical 7-stage filter chips (`NEW`, `CONTACTED`, `SITE_SURVEY`, `QUOTATION_SENT`, `NEGOTIATION`, `WON`, `LOST`), 48x48 touch targets, `Badge` primitive integration, `SkeletonLoader.Card` loading state, `EmptyState` component, virtualized `FlatList`, `useTheme()` tokens. |
| `mobile-app/src/screens/crm/LeadCaptureModal.tsx` | 1-887 | `KeyboardAvoidingContainer` wrapper, `useDirtyFormWarning` / `isDirty` protection, `Input` & `Button` primitives, 6-digit Indian PIN code validation, lead source attribution chips. |
| `mobile-app/src/screens/crm/QuickQuoteScreen.tsx` | 1-1884 | Sizing engine handling Monthly Bill vs Sanctioned Load with advisory warnings, tiered benchmark pricing, TopCon / DCR ALMM module database selection, `Input` & `Button` primitives. |
| `mobile-app/src/screens/crm/QuotationBuilderModal.tsx` | 1-1299 | Dynamic BOM breakdown (Modules, Inverter, Structure, BOS, Installation), Statutory 13.8% Composite Solar GST itemization (70% Goods @ 12% + 30% Services @ 18%), `KeyboardAvoidingContainer`, dirty form guard. |
| `mobile-app/src/screens/crm/CustomerOnboardingModal.tsx` | 1-1129 | 4-step wizard stepper with step indicator, compulsory DISCOM consumer number enforcement, PAN/Aadhaar/IFSC field validations, `KeyboardAvoidingContainer`, unsaved changes protection. |

### Verification Protocol
1. **Automated Perspective Suite**: Run `node mobile-app/test-perspectives.js` to ensure all 23 test perspectives continue passing at 100%.
2. **TypeScript Compilation**: Run `node mobile-app/node_modules/typescript/bin/tsc --project mobile-app/tsconfig.json --noEmit` to ensure 0 type errors.
3. **Form Safety**: Verify closing dirty modal triggers "Discard Unsaved Changes?" confirmation.
4. **Touch Target**: Verify all interactive elements achieve min 48x48 dp touch boundaries.
