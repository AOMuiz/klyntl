# DB Test Plan and Reconciliation Spec

## Purpose

This document captures the spec plan for standardizing debt calculations, reconciling DB inconsistencies, improving audit coverage, detecting orphan/sequence issues and enabling reliable local/device DB integration testing for production-like test cases.

Summary of goals

- Standardize a single canonical signed-change convention for all debt calculations (signed integer in smallest unit, positive = debt increase).
- Replace legacy payment flows with the simplified calculator flow and ensure callers use the new convention.
- Ensure reconciliation runs and produces audit records for any corrective action.
- Provide developer steps and scripts to run integrity checks and to use a real local/device DB for integration testing.

---

## Acceptance criteria

- All calculation functions return a signed numeric change (kobo) as the canonical output.
- computeRunningBalances() and UI code use the signed change directly.
- No negative outstanding values appear in the UI (persisted negatives are logged and clamped for display while the root cause is fixed).
- A reconciliation script exists that can recompute customer outstanding balances and generate audit records for any corrections.
- Tests updated to use the new signed convention; CI runs integrity checks and fails if discrepancies exceed tolerance.

---

## Prioritized implementation steps

1. Standardize calculation output (HIGH)

- Change: `src/services/calculations/SimpleTransactionCalculator.ts` and related calculators to return a signed `change` value in the smallest currency unit (kobo).
- Backwards compatibility: add a small compatibility wrapper if needed and update all callers in a single PR.

2. Hook & UI adjustments (HIGH)

- Update `src/hooks/useTransactionDetails.ts`:
  - Remove manual sign flips and use the calculator's signed change directly in `computeRunningBalances()`.
  - Keep display clamping: `after = Math.max(0, rawAfter)` and `creditCreated = Math.max(0, -rawAfter)`.
  - When reading `persistedOutstanding`, if the value is negative: log a warning with customerId and snapshot. Optionally clamp for display.
- Update `src/screens/transaction/TransactionDetailsScreen.tsx` to clearly use persistedOutstanding as authoritative and show the clamp/log behavior.

3. DB & repository review (HIGH)

- Confirm `CustomerRepository` increase/decrease methods accept positive amounts and apply DB clamping (`MAX(0, ...)` or CASE WHEN ... THEN 0 ...).
- Scan callers to ensure no negative amounts are passed to DB update helpers; add assertion logs if unexpected.

4. Reconciliation & integrity checks (HIGH)

- Ensure migration010 (reconcile) can be run on demand.
- Create `scripts/reconcile-checks.js` to run the SQL checks below and optionally apply corrections (with audit log entries).
- Add a staging run and a manual approval step before running reconcile in production.

5. Tests & CI (MEDIUM)

- Update unit tests for calculators to expect signed results.
- Add tests for `useTransactionDetails.computeRunningBalances()` across representative transaction sequences.
- Add an integration test that runs the reconciliation and asserts no negative outstanding values remain.
- Add a nightly CI job to run `scripts/reconcile-checks.js` and fail if discrepancies exceed tolerance.

6. Audit coverage & monitoring (MEDIUM)

- Ensure all DB mutating operations use `auditService.logEntry(...)` within the same DB transaction.
- Reconcile should write audit records describing corrections (old vs new outstanding, reason).
- Add logging/metrics: count of corrections, warning when negative outstanding is read, alerts for big corrections.

7. Legacy PaymentService cleanup (LOW → MEDIUM)

- If the old PaymentService is no longer used, mark it deprecated or remove it and update tests.

---

## SQL integrity checks

Run these queries against the local/dev DB to detect issues.

- Negative outstanding customers

  ```sql
  SELECT id, outstandingBalance FROM customers WHERE outstandingBalance < 0;
  ```

- Orphaned linked transactions

  ```sql
  SELECT t.id, t.linkedTransactionId
  FROM transactions t
  WHERE t.linkedTransactionId IS NOT NULL
    AND t.linkedTransactionId NOT IN (SELECT id FROM transactions);
  ```

- Computed vs stored outstanding per customer

  ```sql
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
  ```

---

## Reconcile script (outline)

- `scripts/reconcile-checks.js` should:
  - Connect to the SQLite DB used by the app (file path configurable via env or argument).
  - Run the three checks above and output a CSV/JSON report of inconsistencies.
  - Optionally, when invoked with `--apply` and `--audit`, compute corrected outstanding balances and apply DB updates inside transactions while inserting audit records describing the correction.

---

## Using a real local/device DB for integration testing

Problem: unit tests use mocks but some failures only show up when running against the app/device DB. We want a workflow that can run end-to-end tests using the real DB on device/simulator, and allow easy extraction of that DB for offline analysis.

Design options

- Mode toggle (recommended): runtime config toggles between
  - `USE_DEVICE_DB=true` — app connects to the device-local SQLite DB and tests run against it (integration mode), and
  - default (mocked DB) — unit/CI tests run with mocks.

Implementation notes

1. Database service abstraction

- Ensure there is a single DB service factory used by the app, e.g. `createDatabaseService(db)` already exists.
- Provide a small runtime switch in the app bootstrap to choose the DB file path:
  - `DEV_DB_PATH` (when running on device/simulator) — points to app document directory (Expo `FileSystem.documentDirectory` / RNFS path).
  - `IN_MEMORY` or `TEST_DB` for mocked tests.

2. App runtime behavior (dev/test)

- On device/simulator run, start the app with `USE_DEVICE_DB=true` (or toggle via debug menu). The app will open/connect the SQLite DB file at `DEV_DB_PATH` and use it as the authoritative DB.
- When running unit tests (jest), mock the DB service to return an in-memory SQLite instance or a lightweight JS mock.

3. Copying DB from device/simulator to local repo

- Android emulator (adb):
  - Pull DB file from emulator to host machine:
    - adb shell "run-as <app.package> cat /data/data/<app.package>/databases/<dbfile>" > ./public/test-data/device-db.sqlite
    - or adb pull /data/data/<app.package>/databases/<dbfile> ./public/test-data/device-db.sqlite (requires root or run-as permissions)
- iOS Simulator (xcrun simctl):
  - Path example: `~/Library/Developer/CoreSimulator/Devices/<device-id>/data/Containers/Data/Application/<app-id>/Library/Application Support/<dbfile>`
  - Use `xcrun simctl get_app_container <device-id> <bundle-id> data` to get container path and copy the DB file to `./public/test-data/device-db.sqlite`.

Notes: file paths and permissions vary by platform. The app should also provide a debug menu action to export the DB file to the app's Documents folder or share sheet (easier for non-root dev flows).

4. Running tests against the device DB

- Provide an integration test runner script, e.g. `npm run test:integration -- --db ./public/test-data/device-db.sqlite`, which spawns a test runner that points the app/service to the supplied DB file.
- The integration test task should be gated and run only in dev/staging environments, not in standard CI unit runs.

5. Automated extraction during CI/device runs (optional)

- If CI spawns an emulator/simulator for integration tests, add a step that pulls the DB file from the virtual device and stores it as an artifact for triage.

---

## Quick checklist for developer when debugging failing tests that depend on DB

- Run integrity SQL checks against dev DB.
- If failure reproduces on device, export DB and run local reconcile-checks script.
- Inspect audit table for missing entries around problematic tx timestamps.
- Confirm `linkedTransactionId` references exist and are not orphaned.
- If reconciliation corrects values, capture audit records and include them in the bug report.

---

## CI/Monitoring recommendations

- Nightly job: run `scripts/reconcile-checks.js` against a staging DB snapshot. Fail job if corrections count > threshold.
- On app startup in production, add a light-weight health check that samples N customers and compares DB outstanding vs computed; log if mismatch ratio > threshold.
- Expose periodic reconciliation metrics: corrections_last_7d, orphan_count, negative_outstanding_count.

---

## Estimated effort

- Total: ~5–6 working days (calculator standardization, hooks update, reconciliation script, tests, CI job, deprecate legacy service).

---

## Next steps (actionable)

- Decide first PR: (a) change calculators to signed-change + tests, or (b) quick defensive clamp+log in `useTransactionDetails`.
- I can create the reconcile-checks script scaffold and the DB export helper in the app (debug menu action) next.

---

Appendix: useful commands (dev macOS)

- Pull DB from Android emulator (example):

  ```bash
  # replace <app.package> and <dbfile>
  adb exec-out run-as <app.package> cat databases/<dbfile> > ./public/test-data/device-db.sqlite
  ```

- Pull DB from iOS simulator (example):

  ```bash
  # get container path then copy
  xcrun simctl get_app_container booted <bundle-id> data
  cp "<container-path>/Library/Application Support/<dbfile>" ./public/test-data/device-db.sqlite
  ```

- Run reconcile checks (Node script to implement):
  node scripts/reconcile-checks.js --db ./public/test-data/device-db.sqlite
