# Independent Review & Adversarial Verification Report: Milestone M5

**Reviewer**: `reviewer_m5` (`teamwork_reviewer`, `teamwork_critic`)  
**Parent Agent**: `ad2f5e64-da78-454d-ba4a-3ebeb2c3f34b`  
**Milestone**: M5 — Field Operations, Inventory & Mobile Parity  
**Verdict**: **`REQUEST_CHANGES`**  
**Date**: 2026-10-29T17:55:00Z  

---

## 1. Observation

Direct observations from independent code inspection and automated test execution across all target components:

1. **Mobile PDF Statutory Heading Parity**:
   - In `mobile-app/src/services/pdfService.ts`, the statutory scheme `'PM Surya Ghar Muft Bijli Yojana'` is integrated at lines 242 (Scope of Supply), 809 (Consumer Overview), and 1103 (Page 5 BOQ Investment Hero).
   - Execution of `node --test backend/test/unifiedTemplateParity.test.js` passed 100% (1/1 passed):
     ```
     ✅ Financial/Technical element verified: PM Surya Ghar Muft Bijli Yojana
     ✔ backend\test\unifiedTemplateParity.test.js (420.1435ms)
     ```

2. **Mobile 2D Barcode Scanning & Hardware Traceability**:
   - In `mobile-app/src/screens/operations/BarcodeScannerModal.tsx:43-133`, `parseAndValidateBarcode()` parses JSON, delimited strings (`|`, `;`), and raw serials with minimum 5-character enforcement, and validates DCR domestic content against ALMM/DCR patterns (`ALMM`, `DCR`, `WAA-DCR`, `ADANI-DCR`, `TATA-DCR`, etc.).
   - In `BarcodeScannerModal.tsx:139-171`, `detectDuplicateSerial()` checks the current scan session (case-insensitive), matches module serial against inverter serial, and checks project records (`moduleSerials`, `dcrModuleSerials`, `existingSerials`).

3. **Mobile Installation Electrical QA Statutory Gating**:
   - In `mobile-app/src/screens/operations/InstallationQAModal.tsx:71-85`, CEA and IEEE 1547 safety thresholds are strictly enforced:
     - Earth Pit 1 (Inverter): strictly `< 5.0 Ω`
     - Earth Pit 2 (Structure): strictly `< 5.0 Ω`
     - Earth Pit 3 (Lightning Arrestor): strictly `< 5.0 Ω`
     - Anti-Islanding Grid Trip Time: strictly `< 2.0 s`
     - Inverter Insulation Resistance: strictly `> 1.0 MΩ`
   - Inputs are validated with `!isNaN` and `>= 0` (or `> 1.0` for insulation). If any check fails, a statutory violation banner lists exact failure reasons, individual measurements display red `FAIL` tags, and the submit button is disabled.

4. **Web Kanban Touch-Friendly Quick Status Selectors**:
   - In `web-client/src/app/tenant/tasks/page.tsx:166-182`, each Kanban card includes a touch-friendly `<select>` dropdown (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) with `min-h-[32px]` touch target and `e.stopPropagation()` preventing card modal click bubbling.
   - `handleStatusChange` performs optimistic UI update and non-blocking toast notifications.

5. **Automated Verification Commands**:
   - `node --test backend/test/m5FieldOps.test.js`: Passed (17/17 passed in 26.8s).
   - `node --test backend/test/unifiedTemplateParity.test.js`: Passed (1/1 passed).
   - `node mobile-app/test-perspectives.js`: Passed (23/23 passed).
   - `node mobile-app/node_modules/typescript/bin/tsc --noEmit -p mobile-app/tsconfig.json`: Passed (0 errors).
   - `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json`: Passed (0 errors).
   - `npm.cmd --prefix web-client run build`: Passed (66/66 static and dynamic routes generated cleanly).

6. **CRITICAL FINDING — PO Auto-Stock Ledger Concurrency Race Condition**:
   - In `backend/routes/tenant/procurement.js:228-237` (`PATCH /api/tenant/procurement/:id/status`) and `backend/routes/tenant/procurement.js:376-386` (`POST /api/tenant/procurement/:id/receive`):
     ```javascript
     const existingPO = await prisma.purchaseOrder.findFirst({
       where: { id, tenantId: req.user.tenantId },
       include: { items: { include: { product: true } } }
     });

     if (!existingPO) return res.status(404).json({ error: 'Purchase Order not found' });
     if (existingPO.status === 'RECEIVED') {
       return res.status(400).json({ error: 'Purchase Order has already been received' });
     }

     const updated = await prisma.$transaction(async (tx) => {
       ...
     ```
   - Notice that `existingPO` is fetched **outside** `prisma.$transaction`.
   - Inside `prisma.$transaction`, neither endpoint checks `tx.purchaseOrder.findUnique` or executes an atomic conditional update (`where: { id, status: { not: 'RECEIVED' } }`).
   - In `backend/test/m5AdversarialStress.test.js:362`, when 5 concurrent receive requests were fired simultaneously:
     ```
     Concurrent receive statuses: [ 200, 200, 200, 200, 200 ]
     Concurrent test outcome: currentStock=100, ledgerCount=5
     ✖ 1.6: Concurrent receipt requests are idempotent and do not double-increment (7667.7139ms)
       AssertionError [ERR_ASSERTION]: Only one concurrent request must succeed, but 5 succeeded! Statuses: [200,200,200,200,200]
       5 !== 1
     ```
   - All 5 concurrent requests observed `existingPO.status === 'ORDERED'`, entered the transaction, incremented `Product.currentStock` 5 times (from 20 to 100), incremented `StockBalance` 5 times, and created 5 duplicate `StockLedger` movements.

7. **MAJOR FINDING — Status Regression Allows Indefinite Stock Multiplication**:
   - In `backend/routes/tenant/procurement.js:223`, `validStatuses = ['ORDERED', 'SHIPPED', 'RECEIVED', 'CANCELLED']`.
   - `PATCH /api/tenant/procurement/:id/status` does not restrict changing status *away* from `RECEIVED`. A user or client script can update a received PO back to `ORDERED` or `SHIPPED`.
   - When the PO is subsequent PATCHed to `RECEIVED`, line 236 (`if (status === 'RECEIVED' && existingPO.status !== 'RECEIVED')`) triggers again, restocking warehouse inventory and creating duplicate ledger entries without limit.

8. **MINOR FINDING — Hallucinated / Non-Existent Test Paths in Worker Handoff**:
   - `worker_m5/handoff.md:128-130` listed commands for `comprehensiveBusinessJourney.test.js`, `adversarialRoleEscalation.test.js`, and `idempotentPipelineAudit.test.js`. These files do not exist in `backend/test/e2e/`.

---

## 2. Logic Chain

1. **Statutory & Client Parity Verified (Observations 1-5)**:
   - Mobile and web PDF template parity is verified.
   - Field operations barcode parser and electrical QA modal correctly enforce all domain rules and statutory standards.
   - Kanban touch accessibility meets usability specifications.
   - Both TypeScript projects compile with 0 errors and production build succeeds.

2. **Root Cause of Concurrency Vulnerability (Observation 6)**:
   - The status check `existingPO.status === 'RECEIVED'` is performed on a pre-transaction snapshot of the database row.
   - Under concurrent execution (network retry, multiple warehouse clerks clicking submit, UI double-submission), all concurrent calls read `ORDERED` simultaneously.
   - Each transaction executes the restocking loop without verifying that the PO status remains `ORDERED` inside the transaction lock.
   - This directly leads to severe inventory balance corruption and phantom stock creation.

3. **Required Remediation (Observations 6-7)**:
   - Inside `prisma.$transaction`, perform an atomic update or query:
     ```javascript
     const poToReceive = await tx.purchaseOrder.findUnique({
       where: { id },
       include: { items: { include: { product: true } } }
     });
     if (!poToReceive || poToReceive.tenantId !== req.user.tenantId) {
       throw new Error('Purchase Order not found');
     }
     if (poToReceive.status === 'RECEIVED') {
       throw new Error('Purchase Order has already been received');
     }
     ```
     Or use an atomic guard:
     ```javascript
     const updateCount = await tx.purchaseOrder.updateMany({
       where: { id, tenantId: req.user.tenantId, status: { not: 'RECEIVED' } },
       data: { status: 'RECEIVED' }
     });
     if (updateCount.count === 0) {
       throw new Error('Purchase Order has already been received');
     }
     ```
   - In `PATCH /api/tenant/procurement/:id/status`, block reversing status away from `RECEIVED`:
     ```javascript
     if (existingPO.status === 'RECEIVED' && status !== 'RECEIVED') {
       return res.status(400).json({ error: 'Cannot change status of a Purchase Order that has already been received into inventory' });
     }
     ```

---

## 3. Caveats

- Testing of camera hardware was conducted via mock barcode streams and unit parser fuzzing rather than physical device camera hardware sensors.
- Concurrency testing was performed using Node.js test runner against the real development SQLite/Prisma backend.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

While 4 out of 5 deliverables in Milestone M5 (statutory PDF parity, barcode parsing & DCR verification, electrical QA safety gating, Kanban touch selectors) are well-architected and pass independent testing, **`backend/routes/tenant/procurement.js` contains a critical concurrency race condition that causes duplicate inventory restocking and duplicate stock ledger entries under concurrent requests**, failing test `1.6` in `backend/test/m5AdversarialStress.test.js`.

The worker must apply atomic transaction locking on PO receipt and prevent status regression on received POs before M5 can be approved.

---

## 5. Verification Method

To verify the required fix:

```powershell
# 1. Run the empirical stress test (must pass 15/15, including concurrent receipt test 1.6)
node --test backend/test/m5AdversarialStress.test.js

# 2. Run the M5 field ops test suite (must pass 17/17)
node --test backend/test/m5FieldOps.test.js

# 3. Verify unified template parity (must pass 1/1)
node --test backend/test/unifiedTemplateParity.test.js

# 4. Verify TypeScript builds
node mobile-app/node_modules/typescript/bin/tsc --noEmit -p mobile-app/tsconfig.json
node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json
```

### Invalidation Conditions
- Any concurrent receipt request resulting in multiple increments to `StockBalance` or multiple `StockLedger` movements.
- `backend/test/m5AdversarialStress.test.js` reporting any failed tests.
- Re-transitioning a received PO from `ORDERED` to `RECEIVED` producing duplicate stock receipts.
