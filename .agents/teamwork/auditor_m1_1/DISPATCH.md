# Task Assignment: Forensic Auditor M1 — Integrity & Anti-Cheating Forensics

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\auditor_m1_1\
- Role: Forensic Auditor (teamwork_auditor)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## MANDATORY AUDIT ENFORCEMENT
You are the Forensic Auditor. You have a BINARY VETO on milestone completion.
If you find ANY evidence of hardcoded test results, facade implementations, dummy return values, bypassed verification, or cheated tests, you MUST report INTEGRITY VIOLATION.

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read Worker M1's handoff: `f:\Company Products\solar-manager\.agents\teamwork\worker_m1\handoff.md`.

## Scope of Forensic Audit
1. Static analysis of all files modified/created by Worker M1:
   - `docs/mobile-product-audit.md`
   - `docs/mobile-screen-inventory.md`
   - `docs/mobile-ux-problems.md`
   - `docs/mobile-design-system.md`
   - `mobile-app/src/theme/*`
   - `mobile-app/src/components/common/*`
   - `mobile-app/App.tsx`, `mobile-app/app.json`
2. Forensic checks:
   - Check for hardcoded test fixtures in implementation files.
   - Check that `ThemeProvider` actually uses AsyncStorage and device colorScheme.
   - Check that `KeyboardAvoidingContainer` actually wraps `KeyboardAvoidingView` and `ScrollView`.
   - Check that `ModalHeader` actually implements `Alert.alert` on dirty state.
   - Check that `SkeletonLoader` actually loops an `Animated.timing` pulse.
   - Check that all 23 screens in `mobile-screen-inventory.md` actually exist on disk.
3. Formulate explicit verdict: `CLEAN` or `INTEGRITY VIOLATION`.

## Output Deliverable
Write your audit findings to:
`f:\Company Products\solar-manager\.agents\teamwork\auditor_m1_1\audit_report.md`
and write `handoff.md` with explicit Verdict. Maintain `progress.md`.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).


## 2026-10-30T08:23:47Z
You are Forensic Auditor M1 (Integrity Forensics).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\auditor_m1_1\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\auditor_m1_1\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md
Read Worker M1 handoff: f:\Company Products\solar-manager\.agents\teamwork\worker_m1\handoff.md

Conduct a rigorous forensic integrity verification of all files created/modified by Worker M1:
- docs/mobile-product-audit.md
- docs/mobile-screen-inventory.md
- docs/mobile-ux-problems.md
- docs/mobile-design-system.md
- mobile-app/src/theme/*
- mobile-app/src/components/common/*
- mobile-app/App.tsx, app.json

Check for cheating, hardcoding, facade patterns, dummy logic, and verify all 23 screens exist.
Formulate explicit binary verdict: CLEAN or INTEGRITY VIOLATION.
Write audit_report.md and handoff.md in your working directory. Maintain progress.md.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
