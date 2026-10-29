# Milestone M5: Empirical Verification Challenger Report

**Agent**: `challenger_m5` (`teamwork_challenger`)  
**Roles**: `critic`, `specialist`  
**Parent Agent**: `ad2f5e64-da78-454d-ba4a-3ebeb2c3f34b`  
**Working Directory**: `f:\Company Products\solar-manager\.agents\teamwork\challenger_m5\`  
**Timestamp**: 2026-10-29T17:53:00Z  
**Verdict**: **`REQUEST_CHANGES`**

---

## 1. Observation

Direct observations and evidence across all assigned tests, stress harnesses, and source files:

1. **Baseline Test Execution**:
   - `node --test backend/test/m5FieldOps.test.js`:
     ```
     ▶ Milestone M5: Field Operations, Inventory & Mobile Parity Suite
       ✔ Purchase Order Auto-Stock Ledger Automation (15444.0772ms)
       ✔ Statutory Electrical Safety QA Gating Logic (10.2369ms)
       ✔ Mobile 2D Barcode Capture & Hardware Traceability (12.2496ms)
     ✔ Milestone M5: Field Operations, Inventory & Mobile Parity Suite (23159.0659ms)
     ℹ tests 17 | pass 17 | fail 0
     ```
   - `node --test backend/test/unifiedTemplateParity.test.js`:
     ```
     --- ALL UNIFIED TEMPLATE PARITY CHECKS PASSED SUCCESSFULLY! ---
     ✔ backend\test\unifiedTemplateParity.test.js (132.4335ms)
     ℹ tests 1 | pass 1 | fail 0
     ```
   - `node mobile-app/test-perspectives.js`:
     ```
     ====================================================
      TEST SUMMARY: 23 / 23 TESTS PASSED (100% SUCCESS) 
     ====================================================
     ```
   - `node mobile-app/node_modules/typescript/bin/tsc --noEmit -p mobile-app/tsconfig.json`: Exit code 0 (0 errors).
   - `node web-client/node_modules/typescript/bin/tsc --noEmit -p web-client/tsconfig.json`: Exit code 0 (0 errors).

2. **Empirical Challenger Stress Harness (`backend/test/m5AdversarialStress.test.js`)**:
   - 15 adversarial tests executed across 3 suites.
   - 14 tests passed cleanly:
     * Multi-item PO restock with 3 distinct items (modules, inverters, cables) atomically updated `Product.currentStock`, `StockBalance` (quantity & availableQuantity), and logged 3 distinct `StockLedger` audit rows with accurate `quantityBefore`, `quantityAfter`, and `userId`.
     * Sequential duplicate receipt was rejected with HTTP 400 (`'Purchase Order has already been received'`).
     * Cross-tenant PO isolation verified: Tenant B cannot read (404), receive (404), status-update (404), or delete (404) Tenant A's PO.
     * Cross-tenant warehouse ID poisoning attempt neutralized: Tenant A attempting to receive into Tenant B's warehouse ID is safely constrained to Tenant A's warehouse; Tenant B warehouse receives 0 stock.
     * Deleting a received PO is blocked with HTTP 400.
     * Electrical Safety QA boundary tests confirmed:
       - Earth Pit 1, 2, 3: 4.9999Ω PASS, 5.0000Ω FAIL, 5.0001Ω FAIL.
       - Anti-islanding grid trip time: 1.9999s PASS, 2.0000s FAIL, 2.0001s FAIL.
       - Inverter insulation resistance: 1.0001MΩ PASS, 1.0000MΩ FAIL, 0.9999MΩ FAIL.
       - Pathological inputs (`NaN`, `Infinity`, `DROP TABLE`, negative impedance) all rejected.
     * Mobile 2D barcode multi-format parsing (pipe, semicolon, prefixed tags, JSON, minified) and ALMM / DCR domestic content validation verified.
     * Duplicate serial detection (case-insensitive session, inverter clash, project arrays/strings) verified.

3. **Critical Empirical Failure — Concurrency Race Condition in PO Receiving**:
   - Test 1.6 (`1.6: Concurrent receipt requests are idempotent and do not double-increment`) in `backend/test/m5AdversarialStress.test.js` failed:
     ```
     Concurrent receive statuses: [ 200, 200, 200, 200, 200 ]
     Concurrent test outcome: currentStock=100, ledgerCount=5

     ✖ 1.6: Concurrent receipt requests are idempotent and do not double-increment (6979.1009ms)
       AssertionError [ERR_ASSERTION]: Only one concurrent request must succeed, but 5 succeeded! Statuses: [200,200,200,200,200]
       
       5 !== 1
       
           at TestContext.<anonymous> (F:\Company Products\solar-manager\backend\test\m5AdversarialStress.test.js:427:14)
     ```
   - In `backend/routes/tenant/procurement.js:376-386`:
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
     ```
   - In `backend/routes/tenant/procurement.js:236`:
     ```javascript
     if (status === 'RECEIVED' && existingPO.status !== 'RECEIVED') {
       const updated = await prisma.$transaction(async (tx) => {
     ```

---

## 2. Logic Chain

1. **Root Cause Analysis (Observation 3)**:
   - In both `POST /api/tenant/procurement/:id/receive` and `PATCH /api/tenant/procurement/:id/status`, the guard `if (existingPO.status === 'RECEIVED')` evaluates *outside* the `prisma.$transaction`.
   - Under concurrent requests (e.g., rapid double-clicks, mobile client retries, or simultaneous operators), all incoming requests execute `prisma.purchaseOrder.findFirst()` concurrently while the status in the database is still `'ORDERED'`.
   - Every concurrent request passes the `if (existingPO.status === 'RECEIVED')` pre-check and enters `prisma.$transaction`.
   - Inside `prisma.$transaction`, neither endpoint checks the status within `tx`, nor uses an atomic compare-and-swap update (e.g. `tx.purchaseOrder.updateMany({ where: { id, status: { not: 'RECEIVED' } }, data: { status: 'RECEIVED' } })`).
   - Consequently, each concurrent transaction executes `tx.product.update({ data: { currentStock: { increment: ... } } })`, `tx.stockBalance.upsert({ update: { quantity: { increment: ... } } })`, and creates a `tx.stockLedger.create(...)`.

2. **Empirical Impact**:
   - When 5 concurrent requests hit the receive endpoint for a PO containing 20 units:
     * All 5 requests returned HTTP 200 OK.
     * The product inventory was incremented 5 times: `currentStock` increased to 100 instead of 20 (a 400% inventory inflation).
     * `StockBalance` was incremented 5 times.
     * 5 identical `StockLedger` audit entries were created instead of 1.
   - In a production solar ERP, this causes serious phantom inventory, incorrect balance sheets, and corrupted audit logs.

3. **Required Fix**:
   - Inside `prisma.$transaction`, perform an atomic conditional status transition or inside-transaction status validation before executing any stock increments or ledger creations:
     ```javascript
     const updateCount = await tx.purchaseOrder.updateMany({
       where: { id, tenantId: req.user.tenantId, status: { not: 'RECEIVED' } },
       data: { status: 'RECEIVED' }
     });
     if (updateCount.count === 0) {
       throw new Error('Purchase Order has already been received');
     }
     ```
   - If `updateCount.count === 0`, throwing an error rolls back the transaction, returns HTTP 400, and ensures stock is incremented exactly once.

---

## 3. Caveats

- In sequential execution (one request completing before the next arrives), idempotency works correctly because `existingPO.status` is checked before transaction entry. The vulnerability only manifests under concurrent execution window (~100-200ms).
- Electrical Safety QA thresholds and Mobile 2D Barcode validation are completely robust, verified, and ready for production.

---

## 4. Conclusion

- **Verdict**: **`REQUEST_CHANGES`**
- Milestone M5 delivers high-quality features in Electrical QA gating, Mobile 2D Barcode scanning, Unified Template parity, and touch-friendly task controls.
- However, PO stock ledger automation has a critical concurrency race condition that allows concurrent receipt requests to bypass idempotency, multiplying inventory counts and creating duplicate stock ledger entries.
- The Worker must update `backend/routes/tenant/procurement.js` (`POST /:id/receive` and `PATCH /:id/status`) to enforce atomic compare-and-swap status transition inside `prisma.$transaction`.

---

## 5. Verification Method

To independently reproduce the concurrency bug and verify the fix:

```powershell
# 1. Run the empirical stress harness (Test 1.6 will fail until race condition is resolved)
node --test backend/test/m5AdversarialStress.test.js

# 2. Run test 1.6 isolated to observe the concurrent status array and stock inflation
node --test --test-name-pattern="1.6" backend/test/m5AdversarialStress.test.js

# 3. Verify baseline test suites remain intact
node --test backend/test/m5FieldOps.test.js
node --test backend/test/unifiedTemplateParity.test.js
node mobile-app/test-perspectives.js
```

### Invalidation Conditions
- Any occurrence of `currentStock > PO.quantity` or `ledgerCount > 1` when multiple concurrent receipt requests are dispatched for a single purchase order.
