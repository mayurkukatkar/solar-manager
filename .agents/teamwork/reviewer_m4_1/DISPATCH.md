## 2026-10-30T14:49:42Z
You are Reviewer M4-1 (Haptics & Offline Sync Reviewer) for Milestone M4: Native Android Interactions, Performance & Layout Validation.

## Context & Mandatory Reading
1. Read the verbatim user request at:
   `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`
2. Read the master project scope document at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
3. Read Worker M4's handoff report at:
   `f:\Company Products\solar-manager\.agents\teamwork\worker_m4_v2\handoff.md`
4. Working directory:
   `f:\Company Products\solar-manager\.agents\teamwork\reviewer_m4_1\`

## Review Scope
Review and verify Track 1 (Haptics, Touch Ergonomics, BackHandler, Font Scaling) and Track 2 (Offline Sync Queue, Network Listener, OfflineBanner, SWR Caching):
1. **Haptics & Ergonomics**:
   - Inspect `mobile-app/src/utils/haptics.ts`: Verify dual-mode architecture (dynamic `expo-haptics` probe + calibrated `Vibration` pattern array fallback).
   - Verify tactile feedback integration in `Button.tsx`, `ModalHeader.tsx` (`useDirtyFormWarning`), `RootNavigator.tsx` (tabs + FAB), `QuickActionsDispatcher.tsx`, `BarcodeScannerModal.tsx`, `InstallationQAModal.tsx`, and `FieldProjectsScreen.tsx`.
   - Verify `touchTarget.min: Platform.select({ android: 48, default: 44 })` in `tokens.ts` and `hitSlop` in `Header.tsx`, `FieldProjectsScreen.tsx`, `DashboardScreen.tsx`.
   - Verify `onRequestClose` is present on all 6 target modals to eliminate Android BackHandler traps (`OperationsScreen.tsx`, `SurveysModule.tsx`, `InvoicingModule.tsx`, `LoginScreen.tsx`, `LeadsScreen.tsx`, `FinanceScreen.tsx`).
   - Verify `maxFontSizeMultiplier={1.3}` on KPI numbers, badges, and headers.
2. **Offline Sync & Network Resilience**:
   - Inspect `mobile-app/src/services/offlineSyncService.ts`: Verify `@solar_offline_queue`, multi-tenant isolation stamping (`tenantId`, `userId`), idempotent replay engine with exponential backoff & jitter, monotonic stage gating (stages 1–7 never regress), LWW conflict logging (`@solar_conflict_log`), SWR caching (`@solar_cache_*`), and 100% legacy API compatibility (`getDraftLeads`, `saveDraftLead`, etc.).
   - Inspect `mobile-app/src/api/client.ts` and `mobile-app/src/components/OfflineBanner.tsx`: Verify network status listener, auto-sync triggers on reconnection, and animated persistent banner.
   - Verify SWR caching in `FieldProjectsScreen.tsx`, `PipelineScreen.tsx`, and `OperationsScreen.tsx`.
3. **Run Verifications**:
   - Run `cmd /c "cd mobile-app && npx tsc --noEmit"` (must pass with 0 errors).
   - Run `node mobile-app/test-perspectives.js` (must pass 23/23).
   - Run `node mobile-app/test-e2e.js` (must pass 184/184).

## Output Requirements
Write your detailed review to `f:\Company Products\solar-manager\.agents\teamwork\reviewer_m4_1\analysis.md` and complete handoff report to `f:\Company Products\solar-manager\.agents\teamwork\reviewer_m4_1\handoff.md`. Include a clear verdict: APPROVE or REQUEST_CHANGES. Send message to orchestrator with verdict. Do NOT modify source code.
