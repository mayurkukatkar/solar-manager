# Task Assignment: Challenger M1-2 — Empirical Primitives & Layout Stress Testing

## Identity & Role
- Working Directory: f:\Company Products\solar-manager\.agents\teamwork\challenger_m1_2\
- Role: Mobile UI Stress Verifier (teamwork_challenger)
- Parent: Orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b)

## Mandatory Reading
- Read `f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md`.
- Read `f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md`.
- Read Worker M1's handoff: `f:\Company Products\solar-manager\.agents\teamwork\worker_m1\handoff.md`.

## Scope of Adversarial Verification
1. Stress test the 8 shared UI primitives in `mobile-app/src/components/common/`:
   - Write an empirical verification test suite mounting and checking `Button`, `Input`, `Card`, `Badge`, `SkeletonLoader`, `EmptyState`, `KeyboardAvoidingContainer`, and `ModalHeader`.
   - Test extreme inputs: 5,000-character text strings, zero/negative spacing, multiple rapid clicks on loading buttons, unsaved change dirty guards.
2. Formulate explicit verdict: `APPROVE` or `REQUEST_CHANGES`.

## Output Deliverable
Write your findings to:
`f:\Company Products\solar-manager\.agents\teamwork\challenger_m1_2\challenge_report.md`
and write `handoff.md` with explicit Verdict. Maintain `progress.md`.
When finished, send a message to orchestrator (`94d7f2ae-468d-438a-8f95-fa253185584b`).


## 2026-10-30T08:23:40Z
[Message] timestamp=2026-10-30T08:23:40Z sender=94d7f2ae-468d-438a-8f95-fa253185584b priority=MESSAGE_PRIORITY_HIGH content=You are Challenger M1-2 (Mobile UI Stress Verifier).
Working directory: f:\Company Products\solar-manager\.agents\teamwork\challenger_m1_2\
Read instructions: f:\Company Products\solar-manager\.agents\teamwork\challenger_m1_2\DISPATCH.md
Read original request: f:\Company Products\solar-manager\.agents\teamwork\ORIGINAL_REQUEST.md
Read project plan: f:\Company Products\solar-manager\.agents\teamwork\orchestrator\PROJECT.md
Read Worker M1 handoff: f:\Company Products\solar-manager\.agents\teamwork\worker_m1\handoff.md

Stress test the 8 shared UI primitives in mobile-app/src/components/common/.
Test extreme inputs, 5000-char strings, loading spam, dirty form protection.
Formulate explicit verdict: APPROVE or REQUEST_CHANGES.
Write challenge_report.md and handoff.md in your working directory. Maintain progress.md.
When finished, send a message to orchestrator (94d7f2ae-468d-438a-8f95-fa253185584b).
