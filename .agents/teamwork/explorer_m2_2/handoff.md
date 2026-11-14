# Handoff Report: Explorer M2-2 (Dashboard & State Specialist)

**Working Directory:** `f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\`  
**Target File:** `mobile-app/src/screens/dashboard/DashboardScreen.tsx` (1,690 lines)  
**Parent / Recipient:** Orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`)  
**Assignee:** Worker M2 (UI & State Implementation)  

---

## 1. Observation

Direct code inspections of `mobile-app/src/screens/dashboard/DashboardScreen.tsx`, `mobile-app/src/api/endpoints.ts`, `backend/routes/tenant/finance.js`, `backend/routes/tenant/dashboard.js`, and `mobile-app/src/components/common/` revealed the following exact facts:

1. **Hardcoded Fallback Prospects**:
   Lines 277–320 of `DashboardScreen.tsx`:
   ```typescript
   const fallbackRecentLeads = [
     { id: 'lead-1', name: 'Ramesh Patil', mobile: '9822012345', city: 'Nagpur', capacity: 3.3, value: 185000, stage: 'Proposal Sent' ... },
     { id: 'lead-2', name: 'Suresh Deshmukh', mobile: '9822054321', city: 'Pune', capacity: 5.0, value: 275000, stage: 'Survey Booked' ... },
     { id: 'lead-3', name: 'Anand Kulkarni', mobile: '9822088899', city: 'Nashik', capacity: 3.3, value: 191000, stage: 'Erection Active' ... },
   ];
   ```
   At line 345:
   ```typescript
   const activeStreamItems = recentLeads && recentLeads.length > 0 ? recentLeads.map(...) : fallbackRecentLeads;
   ```
   At line 347:
   ```typescript
   const urgentProspect = activeStreamItems[0] || fallbackRecentLeads[0];
   ```

2. **Synthetic Financial & Trajectory Fallbacks**:
   - `fallbackHorizonDataMap` (lines 152–199): hardcoded monthly, quarterly, half-annual, and annual numbers (e.g. FY23-24 48 clients, ₹98.5L revenue).
   - `fallbackInventoryRunway` (lines 220–225): hardcoded "550W Mono PERC Panels (DCR)", "184 Panels (~101 kWp)".
   - `fallbackSubsidyFunnel` (lines 231–236): hardcoded "01 DISCOM Feasibility Approved 24 Sites ₹18.7L".
   - Hardcoded metrics:
     - Line 244: `totalCapacityKWp`: `data.totalCapacity ? data.totalCapacity.toFixed(1) : '37.1'`
     - Line 248: `totalRevenueLakhs`: `data.totalRevenue ? Number((data.totalRevenue / 100000).toFixed(1)) : 84.6`
     - Line 252: `totalCollectedLakhs`: `Number((totalRevenueLakhs * 0.65).toFixed(1))`
     - Line 260: `collectedPct`: fallback `65%`
     - Lines 264–275: Environmental fallback `'48.25'`, `39.4`, `19.2`, `'1,780'`
     - Line 411: `{data.totalLeads || 3}`
     - Line 416: `{projects.length || data.totalProjects || 2}`

3. **Ignored Loading State & Flashing Dummy Content**:
   - Line 75: `const [loading, setLoading] = useState(true);`
   - Line 350: `<View style={styles.container}>` immediately renders `ScrollView`. The `loading` state is never checked in the JSX, meaning the screen always flashes fake dummy data before API responses settle.

4. **Silent Error Swallowing**:
   - Lines 88–92:
     ```typescript
     const [dashRes, prjRes, leadsRes] = await Promise.all([
       tenantApi.getDashboard().catch(() => null),
       tenantApi.getProjects().catch(() => null),
       crmApi.getLeads({ all: true }).catch(() => null),
     ]);
     ```
   - Errors are discarded, leaving the screen permanently populated with fake dummy data when offline or experiencing server errors.

5. **Backend Data Contract**:
   - `backend/routes/tenant/finance.js:11-332` handles `GET /api/tenant/dashboard` and provides real `totalLeads`, `totalProjects`, `totalRevenue`, `totalCollected`, `outstanding`, `totalCapacity`, `horizonAnalytics`, `inventoryRunway`, `subsidyFunnel`, `environmental`, and `isFinanceAuthorized`.
   - When non-finance roles query the endpoint, `backend/routes/tenant/dashboard.js` and `finance.js` restrict financial numbers. However, `DashboardScreen.tsx` lines 248 & 252 leaked fake figures (₹84.6L) to non-finance users.

6. **Available Primitives**:
   - `mobile-app/src/components/common/SkeletonLoader.tsx` exports `SkeletonLoader` with `.Text`, `.Circle`, and `.Card`.
   - `mobile-app/src/components/common/EmptyState.tsx` exports `EmptyState` with `icon`, `title`, `description`, `tone`, and CTA action props.
   - `mobile-app/src/theme/tokens.ts` exports `tabularNums`, `formatInr`, `formatKw`, `radii`, `spacing`, and `typography`.

---

## 2. Logic Chain

1. **Step 1 (P0-3 Remediation)**: Since lines 277–320 and 152–236 inject fictitious entities (`Ramesh Patil`, fake inventory, fake horizons, ₹84.6L fallback) whenever API data is empty or pending, eliminating these definitions ensures the screen adheres strictly to authentic backend data (Requirement R1, R2).
2. **Step 2 (Loading State Hardening)**: Because line 75 defines `loading` but line 350 immediately renders the operational view, inserting a top-level `if (loading && !refreshing)` conditional rendering compound `SkeletonLoader` primitives (`SkeletonLoader.Card`, `SkeletonLoader.Text`, `SkeletonLoader`) eliminates the flash of unstyled/dummy content and provides a smooth skeleton pulse.
3. **Step 3 (Error State Recovery)**: Because lines 88–92 swallow network exceptions with `.catch(() => null)`, adopting `Promise.allSettled` and capturing explicit error strings allows the screen to render an actionable `EmptyState(tone="danger")` with a "Retry Connection" CTA, enabling reliable offline/error recovery.
4. **Step 4 (Empty State Guidance)**: When collections (`recentLeads`, `urgentProspect`, `activeHorizonData`, `subsidyFunnel`, `inventoryRunway`) are genuinely empty (length === 0), rendering informative `EmptyState` cards with primary CTAs ("Create First Lead", "60s Quick Quote") directly instructs new tenants on how to proceed.
5. **Step 5 (Role-Based Customization)**: Since `user.role` and `hasFinanceAccess` determine operational scope, adapting the Hero Command Card (Financial turnover for `TENANT_ADMIN` vs Active kWp capacity and site surveys for `TENANT_SUB_ADMIN`) ensures field engineers and sales consultants receive relevant operational telemetry without sensitive financial figures.
6. **Step 6 (Tabular Numerals & Anti-Jitter)**: Applying `tabularNums` (`fontVariant: ['tabular-nums']`) from `src/theme/tokens.ts` across all metric counters prevents layout shifts and font jitter during comparative horizon browsing.

---

## 3. Caveats

- **Active Projects Stage Breakdown**: While `tenantApi.getProjects()` supplies an array of projects, detailed stage progression gating (Survey -> Structure -> Material -> Install -> Testing -> NetMeter -> Commissioning) is orchestrated in `FieldProjectsScreen` (Milestone M3). `DashboardScreen` displays high-level node counters.
- **Push Notification Triggering**: Push updates for instant real-time telemetry updates were not inspected; the screen relies on initial mount and pull-to-refresh (`RefreshControl`).
- No other caveats.

---

## 4. Conclusion

`DashboardScreen.tsx` can be completely transformed into a world-class, 100% authorized operational command center without requiring any backend modifications. 

A complete, drop-in replacement has been authored and documented in `f:\Company Products\solar-manager\.agents\teamwork\explorer_m2_2\analysis.md`. It eliminates every dummy fallback, incorporates `SkeletonLoader` and `EmptyState` compound primitives, dynamically branches between Executive Financial and Field Operations radars based on `user.role`, enforces `tabularNums` font stability, and provides robust retryable error handling.

---

## 5. Verification Method

Independent verification of the blueprint and its drop-in implementation:

1. **TypeScript Type Safety**:
   ```powershell
   cd "f:\Company Products\solar-manager\mobile-app"
   npx tsc --noEmit
   ```
   *Expected result:* 0 errors.

2. **Automated Perspective Regression Suite**:
   ```powershell
   cd "f:\Company Products\solar-manager\mobile-app"
   node test-perspectives.js
   ```
   *Expected result:* 10/10 test perspectives pass with 0 failures.

3. **Zero Dummy Data Grep Verification**:
   ```powershell
   rg "Ramesh Patil|fallbackHorizonDataMap|fallbackSubsidyFunnel|fallbackInventoryRunway|fallbackRecentLeads" "mobile-app/src/screens/dashboard/DashboardScreen.tsx"
   ```
   *Expected result:* 0 matches.

4. **Visual & State Flow Inspection**:
   - Initial load: Pulsing `SkeletonLoader` placeholders render; zero dummy data flashes.
   - Network failure: Centered danger `EmptyState` appears with "Retry Connection" button.
   - Zero leads in database: `EmptyState` appears with "Create First Lead" CTA.
   - Admin login: Executive Hero Card displays Invoiced Revenue (`₹XX.XL`), Collections Progress, and Receivables.
   - Field Tech login: Operational Hero Card displays Active Fleet Capacity (`XX.X kWp`), Sites in Erection, and Site Surveys.
