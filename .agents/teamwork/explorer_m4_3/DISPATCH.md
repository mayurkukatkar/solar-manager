## 2026-10-30T13:34:53Z
You are Explorer M4-3 (Virtualization & Permissions Specialist) for Milestone M4: Native Android Interactions, Performance & Layout Validation.

## Context & Mandatory Reading
1. Read the verbatim user request at:
   `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`
2. Read the master project scope document at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
3. Working directory:
   `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_3\`

## Investigation Scope
Investigate list virtualization, computational performance, memoization, and Android permission UX across the mobile application:
1. Audit all FlatList and heavy list implementations:
   - `PipelineScreen.tsx` (lead cards)
   - `FieldProjectsScreen.tsx` (project cards)
   - `OperationsScreen.tsx` (dispatch tasks & checklist items)
   - `FinanceScreen.tsx` (invoice milestone items)
   - `ModulesScreen.tsx` (module grid)
   - Check and specify optimal virtualization parameters: `getItemLayout` (fixed or approximate card heights), `windowSize={7}`, `maxToRenderPerBatch={10}`, `initialNumToRender={8}`, `removeClippedSubviews={true}` on Android, and memoized `keyExtractor` / `renderItem` using `useCallback` to prevent garbage collection spikes.
2. Audit computational memoization & search debouncing:
   - Identify heavy recalculations (e.g. 13.8% composite solar GST, milestone splits, CEA safety thresholds, aging overdue calculations) and verify they use `useMemo`.
   - Ensure search and filter inputs (e.g. `GlobalSearchModal.tsx`, pipeline filtering, project stage filtering) implement a 300ms debounce to prevent API thrashing and UI stuttering.
3. Audit Android Permissions UX:
   - Examine how camera, photo library, and storage permissions are handled in `BarcodeScannerModal.tsx`, `OperationsScreen.tsx` (job site photos), `CustomerOnboardingModal.tsx` (KYC docs), and `ProjectDossierModal.tsx`.
   - Specify a standardized, user-friendly permission flow (`PermissionRationaleModal` or enhanced permission hook) that explains *why* the permission is required (e.g. "Camera access is needed to scan solar panel serial barcodes and capture commissioning photos"), handles permanent denial gracefully, and provides direct deep linking to Android App Settings.

## Output Requirements
Write your comprehensive architectural investigation and concrete, line-by-line implementation blueprint to:
`f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_3\analysis.md`
Then write `handoff.md` and message the orchestrator (`send_message`). Do NOT modify source code directly.
