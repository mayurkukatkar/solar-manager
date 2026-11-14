## 2026-10-30T13:34:42Z

You are Explorer M4-2 (Offline Sync & Network Specialist) for Milestone M4: Native Android Interactions, Performance & Layout Validation.

## Context & Mandatory Reading
1. Read the verbatim user request at:
   `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`
2. Read the master project scope document at:
   `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`
3. Working directory:
   `f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_2\`

## Investigation Scope
Investigate network resilience, offline operation, and mutation synchronization across the mobile application:
1. Examine `mobile-app/package.json` for network detection libraries (such as `expo-network` or `@react-native-community/netinfo`) and examine existing offline code in `mobile-app/src/services/offlineSyncService.ts`, `mobile-app/src/api/client.ts`, and `mobile-app/src/context/AuthContext.tsx`.
2. Design a persistent, non-intrusive `NetworkStatusBar` or `OfflineBanner` component:
   - Visible when offline or connecting, displaying offline state with pending mutation count (e.g. "Working Offline — 2 changes queued for sync").
   - Automatically hides when online, or flashes brief green confirmation ("Back online — syncing queued updates...").
   - Integrated into `Header.tsx` or `RootNavigator.tsx` so all screens inherit it seamlessly.
3. Audit and strengthen `offlineSyncService.ts`:
   - Enqueue offline mutations (lead creation, project stage update, QA readings, photo metadata) in `SafeStorage` (`@solar_offline_queue`).
   - Idempotent replay with exponential backoff / retry mechanism when connectivity is restored.
   - Conflict resolution strategy: Client-timestamped mutations with server-wins or last-write-wins policy.
   - Detailed queue inspection methods (`getQueue()`, `getPendingCount()`, `retryFailed()`, `clearQueue()`).
4. Audit session expiration and partial data handling:
   - Ensure offline cached GET responses provide fallback data so EPC technicians can view project details and checklists in remote solar fields without cellular reception.

## Output Requirements
Write your comprehensive architectural investigation and concrete, line-by-line implementation blueprint to:
`f:\Company Products\solar-manager\.agents\teamwork\explorer_m4_2\analysis.md`
Then write `handoff.md` and message the orchestrator (`send_message`). Do NOT modify source code directly.
