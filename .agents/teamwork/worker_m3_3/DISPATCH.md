## 2026-10-30T13:09:18Z
You are Worker M3-3 (Remediation Specialist) for Milestone M3: End-to-End Module, Screen & Workflow Transformation.

## Working Directory
`.agents/teamwork/worker_m3_3/`

## Context & Inputs
1. Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
2. Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
3. Read Reviewer M3-2 handoff report: `f:\Company Products\solar-manager\.agents\teamwork\reviewer_m3_2\handoff.md`.
4. Read the verified Remediation Blueprint: `f:\Company Products\solar-manager\.agents\teamwork\explorer_m3_remediation\analysis.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Target Files and Remediation Tasks
Follow the exact line-by-line remediation blueprints in `.agents/teamwork/explorer_m3_remediation/analysis.md` across the 4 files:

1. **`mobile-app/src/screens/projects/FieldProjectsScreen.tsx` (F-01)**:
   - On line 140, remove `|| true` so that `met: Boolean(hasSerials)` strictly requires serials to be recorded.
   - On line 157, replace hardcoded `met: true` with genuine CEA safety threshold validation (`Boolean(proj?.qaPassed || (proj?.qaReadings && proj.qaReadings.earthPit1 < 5.0 && proj.qaReadings.tripTime < 2.0))`).
   - Hydrate `qaReadings` and module serials from `SafeStorage` (`@solar_qa_${proj.id}` and `@solar_serials_${proj.id}`) when opening `StageAdvancementModal`.

2. **`mobile-app/src/screens/operations/OperationsScreen.tsx` (F-02)**:
   - Eliminate `handleSimulateScan` which fabricates `Math.random()` serials.
   - Import and mount the real `BarcodeScannerModal` (`../operations/BarcodeScannerModal`) when the user taps "Scan PV Module QR Code", and add scanned serials to the job state upon real scan completion.
   - Clear fake initial serials array (initialize with empty array `[]` or genuine job serials).
   - Clear fake pre-captured photos array. Integrate `expo-image-picker` (`ImagePicker.launchCameraAsync` / `launchImageLibraryAsync`) to capture actual site photos.
   - Replace hardcoded Pune coordinates in `handleSiteCheckIn` with real job address/location (`job.siteAddress || 'Site Location'`).
   - Replace the static text `<Text>SHA256: 8f9b...3c1a (Verified)</Text>` with genuine dynamic handover sign-off metadata (recording signer name, role, timestamp, and signature state).

3. **`mobile-app/src/screens/projects/ProjectDossierModal.tsx` (F-03)**:
   - In `handleAdvanceStage`, implement prerequisite gating check (`checkStagePrerequisites(project, nextStageObj.key)`). If mandatory prerequisites (such as consumer number, site photos, module serials, or CEA tests) are unmet, display an informative warning alert and block stage advancement.

4. **`mobile-app/src/screens/operations/InstallationQAModal.tsx` (F-04)**:
   - In `handleSubmitQA`, persist the certified readings payload to `SafeStorage.setItem('@solar_qa_' + project.id, JSON.stringify(qaPayload))`.
   - Hydrate previously saved QA readings from `SafeStorage.getItem('@solar_qa_' + project.id)` upon modal open.

## Verification Requirements
Execute commands via cmd.exe / node:
1. `cmd /c "cd mobile-app && npx tsc --noEmit"` -> Must pass with 0 errors!
2. `node mobile-app/test-perspectives.js` -> 23 / 23 tests MUST pass (100% success)!
3. `node mobile-app/test-e2e.js` -> 184 / 184 tests MUST pass (100% success)!
4. `node --test mobile-app/tests/tier5-m3-ops-finance-stress.js` -> 30 / 30 tests MUST pass!
5. `node mobile-app/tests/tier5-m3-crm-stress.js` -> 22 / 22 tests MUST pass!

## Output Requirements
- Write your detailed handoff report to `.agents/teamwork/worker_m3_3/handoff.md` with sections: Observation, Logic Chain, Caveats, Conclusion, Verification Method.
- Send completion message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).
