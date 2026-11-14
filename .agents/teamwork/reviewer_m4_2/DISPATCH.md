## 2026-10-30T14:49:55Z
You are Reviewer M4-2 (Virtualization & Permissions Reviewer) for Milestone M4: Native Android Interactions, Performance & Layout Validation.

## Context & Mandatory Reading
1. Read the verbatim user request at:
   `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`
2. Read the master project scope document at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
3. Read Worker M4's handoff report at:
   `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_v2\handoff.md`
4. Working directory:
   `f:\Company Products\solar-manager\.agents\teamwork\reviewer_m4_2\`

## Review Scope
Review and verify Track 3 (List Virtualization, Computational Memoization, Debouncing, and Android Permissions UX):
1. **List Virtualization**:
   - Inspect `mobile-app/src/screens/projects/FieldProjectsScreen.tsx`: Verify plain `ScrollView.map()` is replaced by `<FlatList>` with `getItemLayout` (180dp), `windowSize={7}`, `maxToRenderPerBatch={10}`, `initialNumToRender={8}`, `removeClippedSubviews={Platform.OS === 'android'}`, memoized `keyExtractor`, and `useCallback` for `renderProjectItem`.
   - Inspect `mobile-app/src/screens/operations/OperationsScreen.tsx`: Verify `ScrollView.map()` is replaced by `<FlatList>` with `getItemLayout` (224dp), `windowSize={7}`, `maxToRenderPerBatch={10}`, and memoized `renderJobItem`.
   - Inspect `mobile-app/src/screens/finance/FinanceScreen.tsx`: Verify outer `ScrollView` is converted to `<FlatList>` with `getItemLayout` (200dp), `ListHeaderComponent` (for executive KPIs, aging ribbon, 13.8% GST banner, search/filter controls), `windowSize={7}`, and memoized `renderInvoiceItem`.
   - Inspect `mobile-app/src/screens/crm/PipelineScreen.tsx`: Verify lead card virtualization with `getItemLayout` (180dp), memoized `renderLeadCard`, and `keyExtractor`.
2. **Computational Memoization & Debouncing**:
   - Inspect `mobile-app/src/hooks/useDebounce.ts` and `src/utils/useDebounce.ts`: Verify 300ms debounce implementation and its wiring in `Header.tsx` and `FinanceScreen.tsx`.
   - Inspect `QuotationBuilderModal.tsx`, `InstallationQAModal.tsx`, and `QuickQuoteScreen.tsx`: Verify statutory 13.8% composite solar GST arithmetic (70% goods @ 12% + 30% services @ 18%), BOM splits, DBT subsidy ceilings, and CEA safety thresholds are wrapped in `useMemo`.
3. **Android Permissions UX**:
   - Inspect `mobile-app/src/components/common/PermissionRationaleModal.tsx`: Verify domain-specific PM Surya Ghar / MNRE justification, Lucide icons, and `Linking.openSettings()` deep-linking.
   - Inspect `mobile-app/src/hooks/useAppPermissions.ts` and `src/utils/useAppPermissions.ts`: Verify `AppState` resume listener detecting returns from Settings.
   - Verify wiring in `BarcodeScannerModal.tsx`, `OperationsScreen.tsx`, `CustomerOnboardingModal.tsx`, and `ProjectDossierModal.tsx`, ensuring permanent denial dead-ends (`canAskAgain === false`) are fully resolved.
4. **Run Verifications**:
   - Run `cmd /c "cd mobile-app && npx tsc --noEmit"` (must pass with 0 errors).
   - Run `node mobile-app/test-perspectives.js` (must pass 23/23).
   - Run `node mobile-app/test-e2e.js` (must pass 184/184).

## Output Requirements
Write your detailed review to `f:\Company Products\solar-manager\.agents\teamwork\reviewer_m4_2\analysis.md` and complete handoff report to `f:\Company Products\solar-manager\.agents\teamwork\reviewer_m4_2\handoff.md`. Include a clear verdict: APPROVE or REQUEST_CHANGES. Send message to orchestrator with verdict. Do NOT modify source code.
