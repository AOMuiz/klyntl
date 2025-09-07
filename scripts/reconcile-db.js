#!/usr/bin/env node

/**
 * CLI script to run reconciliation migration (non-destructive dry-run option)
 * Usage:
 *  node scripts/reconcile-db.js --dry-run
 *  node scripts/reconcile-db.js --apply
 *
 * It will connect to the local SQLite db used by the app (klyntl.db) via better-sqlite3
 * and run safe read-only checks or execute migration 10.
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const argv = require("minimist")(process.argv.slice(2));

const DB_PATH = path.resolve(process.cwd(), "klyntl.db");

function openDb() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database file not found at", DB_PATH);
    process.exit(1);
  }
  return new Database(DB_PATH, { readonly: argv["dry-run"] ? true : false });
}

function listCustomersSample(db) {
  const customers = db
    .prepare(
      "SELECT id, name, outstandingBalance, credit_balance FROM customers"
    )
    .all();
  console.log("Customers and balances (sample):");
  console.table(customers.slice(0, 50));
  return customers;
}

function computeOutstandingFromTransactions(db, customerId) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(remainingAmount),0) as outstanding FROM transactions WHERE customerId = ? AND type IN ('sale','credit') AND isDeleted = 0`
    )
    .get(customerId);
  return row ? row.outstanding : 0;
}

function runDryRun() {
  const db = openDb();
  try {
    const customers = listCustomersSample(db);
    const diffs = [];
    for (const c of customers) {
      const computed = computeOutstandingFromTransactions(db, c.id);
      if (Number(computed) !== Number(c.outstandingBalance)) {
        diffs.push({
          id: c.id,
          name: c.name,
          current: c.outstandingBalance,
          computed,
        });
      }
    }

    if (!diffs.length) {
      console.log(
        "No discrepancies found between customers.outstandingBalance and transactions.remainingAmount sums"
      );
    } else {
      console.log("Discrepancies found (showing up to 200):");
      console.table(diffs.slice(0, 200));
    }
  } finally {
    db.close();
  }
}

function applyReconciliation() {
  const db = openDb();
  const now = new Date().toISOString();

  try {
    const customers = db.prepare("SELECT id FROM customers").all();

    const updateStmt = db.prepare(
      "UPDATE customers SET outstandingBalance = ?, updatedAt = ? WHERE id = ?"
    );
    const tx = db.transaction((cs) => {
      for (const c of cs) {
        const computed = computeOutstandingFromTransactions(db, c.id);
        updateStmt.run(computed, now, c.id);
      }
    });

    tx(customers);

    // Fix transaction statuses
    db.prepare(
      `UPDATE transactions SET status = CASE WHEN COALESCE(remainingAmount,0) = 0 THEN 'completed' WHEN COALESCE(remainingAmount,0) > 0 THEN 'partial' ELSE status END`
    ).run();

    // Create legacy payment_audit for payments appliedToDebt without audit
    db.prepare(
      `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, currency, metadata, created_at) SELECT lower(hex(randomblob(8))), customerId, id, 'payment', amount, 'NGN', json_object('legacy_allocation', 1), datetime('now') FROM transactions t WHERE t.type = 'payment' AND t.appliedToDebt = 1 AND NOT EXISTS (SELECT 1 FROM payment_audit p WHERE p.source_transaction_id = t.id)`
    ).run();

    console.log("Reconciliation applied successfully");
  } finally {
    db.close();
  }
}

async function main() {
  if (argv["help"] || argv["h"]) {
    console.log("Usage: node scripts/reconcile-db.js --dry-run | --apply");
    process.exit(0);
  }

  if (!argv["dry-run"] && !argv["apply"]) {
    console.error(
      "Specify --dry-run to inspect or --apply to perform reconciliation"
    );
    process.exit(2);
  }

  if (argv["dry-run"]) {
    runDryRun();
  } else if (argv["apply"]) {
    applyReconciliation();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
