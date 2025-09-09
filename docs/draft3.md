Spec plan: standardize debt sign, remove legacy payment paths, reconcile DB, add tests & monitoring

Goal

- Standardize financial calculations to use a single canonical signed-change convention (signed integer in smallest unit, positive = debt increase, negative = debt decrease).
- Replace legacy/unused PaymentService assumptions with the simplified calculator flow.
- Eliminate UI/DB mismatches (calculated balance ≠ stored balance), ensure audit coverage, detect orphan/sequence issues, and add reconciliation/monitoring.

Scope

- Code: calculation layer, transaction-details hooks, reconciliation, DB reads, tests, minor UI defensive changes.
- Files (examples):
  - SimpleTransactionCalculator.ts
  - useTransactionDetails.ts
  - TransactionDetailsScreen.tsx
  - TransactionRepository.ts (review)
  - PaymentService.ts (mark/deprecate/remove legacy)
  - migrations.ts (migration010 / reconcile)
  - tests under **tests** and hooks tests

High-level approach (phased)

1. Design & small discovery (0.5d)

   - Confirm which old PaymentService endpoints are still referenced (grep).
   - Decide whether to fully remove old service or keep as deprecated wrapper.

2. Canonical calculation change (1d)

   - Update `SimpleTransactionCalculator.calculateDebtImpact` (and related methods) to return a signed numeric change in smallest unit (kobo) and optional derived impact type.
     - New shape: { change: number /_ signed kobo _/, impactType?: "debt_increase"|"debt_decrease"|"no_change" }
   - Update `calculateCustomerBalanceImpact` similarly (signed debtChange, creditChange positive numbers or signed convention).
   - Keep helper methods for `handleOverpayment` but return kobo integers.

3. Hook & UI updates (0.5d)

   - Update useTransactionDetails.ts:
     - Remove sign-flipping logic (no more isDecrease ? -impact.change : impact.change).
     - Use signed change directly in `computeRunningBalances`.
     - Keep UI clamping for display only:
       - rawAfter = before + signedChange
       - after = Math.max(0, rawAfter)
       - creditCreated = Math.max(0, -rawAfter)
     - Add defensive log: if persistedOutstanding < 0 -> console.warn with customerId & snapshot; optionally clamp persisted value for display.
   - Update TransactionDetailsScreen.tsx to be explicit about using persistedOutstanding only as authoritative and log/clamp before showing negative numbers.

4. DB & repository review (0.5–1d)

   - Review `TransactionRepository.calculateDebtChange` and `CustomerRepository` methods to ensure they accept positive amounts for increase/decrease helpers and use DB clamping (they already use `MAX(0, ...)`/CASE).
   - Ensure all callers pass positive amounts to increase/decrease helpers; add asserts/logs if negative amounts passed.

5. Reconciliation & integrity checks (1d)

   - Ensure `migration010` (reconcile) is complete and can be run on demand.
   - Create a lightweight script `scripts/reconcile-checks.js` (or `node` file) to run the SQL checks:
     - negative outstanding customers
     - orphaned transactions (linkedTransactionId points to missing)
     - computed vs stored outstanding per customer (SQL provided below)
   - Add an option to `migration010` to generate audit entries when it corrects balances (if not already present).

6. Tests (1–1.5d)

   - Update and add unit tests:
     - `SimpleTransactionCalculator` tests to expect signed changes (update existing tests).
     - Hook tests for `useTransactionDetails.computeRunningBalances` with multiple sequences, mixed transactions, and persistedOutstanding present.
     - Integration test that runs `migration010` and asserts no customer has negative outstanding.
   - Add a regression test for the original -3000 scenario.

7. CI / monitoring (0.5d)

   - Add a nightly CI job or workflow step to run reconcile-checks against a dev DB snapshot; fail if discrepancies found over a tolerance.
   - Add runtime logs/metrics:
     - Counter for reconciliation corrections
     - Alert if negative outstanding is observed in production on read

8. Cleanup / deprecation of legacy PaymentService (0.5–1d)

   - Remove or mark PaymentService.ts as deprecated if fully unused.
   - If removal, update all imports and tests.
   - Keep tests for allocation logic but adapt to the simplified services.

Risk & mitigations

- Risk: changing calculator output shape breaks many callers.
  - Mitigation: change shape but add compatibility wrapper function (temporary) that returns { change, impactType } and add compile-time errors for callers still using old shape. Update callers in single PR.
- Risk: reconciliation causing large corrections in prod.
  - Mitigation: run reconcile on staging/dev first; produce a report of corrections; gate production run behind manual approval and snapshot backup.
- Risk: missing audit records when reconciling.
  - Mitigation: make reconcile generate audit records for each correction and store details (old vs new).

Acceptance criteria

- Unit tests pass and updated to signed-change convention.
- `computeRunningBalances()` returns consistent results matching DB reconciliation for sample customers.
- No negative outstanding values shown in UI (persisted negative values are logged and clamped in display).
- Reconcile script identifies any mismatches and can correct them with audit logs.
- Legacy PaymentService references removed or marked deprecated and tests updated.

SQL checks (copy/paste)

- Negative outstanding:
  SELECT id, outstandingBalance FROM customers WHERE outstandingBalance < 0;
- Orphaned linked transactions:
  SELECT t.id, t.linkedTransactionId FROM transactions t WHERE t.linkedTransactionId IS NOT NULL AND t.linkedTransactionId NOT IN (SELECT id FROM transactions);
- Computed vs stored outstanding:
  WITH tx AS (
  SELECT customerId,
  SUM(
  CASE
  WHEN type IN ('sale','credit') THEN COALESCE(remainingAmount, amount)
  WHEN type = 'payment' THEN -COALESCE(paidAmount, amount)
  WHEN type = 'refund' THEN -COALESCE(amount,0)
  ELSE 0
  END
  ) AS computedOutstanding
  FROM transactions
  GROUP BY customerId
  )
  SELECT c.id, c.outstandingBalance, COALESCE(tx.computedOutstanding,0) AS computedOutstanding
  FROM customers c LEFT JOIN tx ON c.id = tx.customerId
  WHERE COALESCE(c.outstandingBalance,0) <> COALESCE(tx.computedOutstanding,0);

Estimated effort (rough)

- Total: ~5–6 working days (depends on tests, reconciler complexity, production rollout policy).

Deliverables (per PR)

- PR 1: Calculator + tests (signed-change) + compatibility wrapper
- PR 2: Hook + UI defensive clamp/log + unit tests
- PR 3: Reconcile-checks script + migration updates + integration test
- PR 4: Remove/deprecate legacy PaymentService + tests cleanup
- PR 5: CI job + monitoring config

Next action

- Confirm I should:
  - implement PR 1 (change SimpleTransactionCalculator to signed-change + update tests), or
  - start with the defensive clamp/log in `useTransactionDetails` (quick immediate fix).

Which do you want me to do first?
