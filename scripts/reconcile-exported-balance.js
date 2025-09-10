#!/usr/bin/env node

/**
 * Database Reconciliation Script for Exported Klyntl Database
 *
 * This script will fix the balance discrepancies found in the analysis
 * by recalculating and updating customer balances based on transactions
 */

const Database = require("better-sqlite3");
const fs = require("fs");

function formatCurrency(amount) {
  return `₦${(amount / 100).toLocaleString()}`;
}

function calculateCorrectBalances(db) {
  console.log("=== CALCULATING CORRECT BALANCES ===\n");

  const customers = db.prepare("SELECT id, name FROM customers").all();
  const corrections = [];

  for (const customer of customers) {
    const transactions = db
      .prepare(
        `
      SELECT * FROM transactions 
      WHERE customerId = ? AND isDeleted = 0 
      ORDER BY date ASC
    `
      )
      .all(customer.id);

    if (transactions.length === 0) continue;

    let outstandingBalance = 0;
    let creditBalance = 0;

    for (const tx of transactions) {
      if (tx.type === "sale" || tx.type === "credit") {
        // These create debt
        outstandingBalance += tx.remainingAmount || tx.amount;
      } else if (tx.type === "payment") {
        if (tx.appliedToDebt === 1) {
          // Payment applied to debt
          outstandingBalance -= tx.amount;
        } else {
          // Payment goes to credit balance
          creditBalance += tx.amount;
        }
      } else if (tx.type === "refund") {
        // Refunds reduce debt
        outstandingBalance -= tx.amount;
      }
    }

    // Outstanding balance can't be negative
    outstandingBalance = Math.max(0, outstandingBalance);

    // Get current stored values
    const current = db
      .prepare(
        "SELECT outstandingBalance, credit_balance FROM customers WHERE id = ?"
      )
      .get(customer.id);

    if (
      current.outstandingBalance !== outstandingBalance ||
      current.credit_balance !== creditBalance
    ) {
      corrections.push({
        customerId: customer.id,
        name: customer.name,
        currentOutstanding: current.outstandingBalance,
        correctOutstanding: outstandingBalance,
        currentCredit: current.credit_balance,
        correctCredit: creditBalance,
        transactions: transactions.length,
      });
    }
  }

  return corrections;
}

function showCorrections(corrections) {
  console.log("=== CORRECTIONS NEEDED ===\n");

  if (corrections.length === 0) {
    console.log("✅ No corrections needed - all balances are correct!");
    return;
  }

  corrections.forEach((correction, index) => {
    console.log(
      `${index + 1}. ${correction.name} (${correction.customerId.substring(
        0,
        12
      )}...)`
    );
    console.log(
      `   Outstanding Balance: ${formatCurrency(
        correction.currentOutstanding
      )} → ${formatCurrency(correction.correctOutstanding)}`
    );
    console.log(
      `   Credit Balance: ${formatCurrency(
        correction.currentCredit
      )} → ${formatCurrency(correction.correctCredit)}`
    );
    console.log(`   Transactions: ${correction.transactions}`);
    console.log("");
  });

  const totalOutstandingDiff = corrections.reduce(
    (sum, c) => sum + (c.correctOutstanding - c.currentOutstanding),
    0
  );
  const totalCreditDiff = corrections.reduce(
    (sum, c) => sum + (c.correctCredit - c.currentCredit),
    0
  );

  console.log(
    `Total Outstanding Balance Adjustment: ${formatCurrency(
      totalOutstandingDiff
    )}`
  );
  console.log(
    `Total Credit Balance Adjustment: ${formatCurrency(totalCreditDiff)}`
  );
}

function applyCorrections(db, corrections, dryRun = true) {
  if (corrections.length === 0) {
    console.log("No corrections to apply.");
    return;
  }

  if (dryRun) {
    console.log("\n=== DRY RUN - NO CHANGES WILL BE MADE ===");
    console.log("Add --apply flag to actually make changes");
    return;
  }

  console.log("\n=== APPLYING CORRECTIONS ===");

  const updateStmt = db.prepare(`
    UPDATE customers 
    SET outstandingBalance = ?, credit_balance = ?, updatedAt = ?
    WHERE id = ?
  `);

  const now = new Date().toISOString();
  let appliedCount = 0;

  const transaction = db.transaction((corrections) => {
    for (const correction of corrections) {
      updateStmt.run(
        correction.correctOutstanding,
        correction.correctCredit,
        now,
        correction.customerId
      );

      console.log(`✅ Updated ${correction.name}`);
      appliedCount++;
    }
  });

  transaction(corrections);

  console.log(`\n✅ Successfully applied ${appliedCount} corrections`);
}

function generateSQLScript(corrections) {
  if (corrections.length === 0) return;

  const now = new Date().toISOString();
  const sqlLines = [
    "-- Klyntl Database Balance Correction Script",
    `-- Generated on: ${now}`,
    "-- This script fixes balance discrepancies found in the exported database",
    "",
    "BEGIN TRANSACTION;",
    "",
  ];

  corrections.forEach((correction) => {
    sqlLines.push(`-- Update ${correction.name} (${correction.customerId})`);
    sqlLines.push(`UPDATE customers SET`);
    sqlLines.push(`  outstandingBalance = ${correction.correctOutstanding},`);
    sqlLines.push(`  credit_balance = ${correction.correctCredit},`);
    sqlLines.push(`  updatedAt = '${now}'`);
    sqlLines.push(`WHERE id = '${correction.customerId}';`);
    sqlLines.push("");
  });

  sqlLines.push("COMMIT;");
  sqlLines.push("");
  sqlLines.push("-- Verification queries:");
  sqlLines.push(
    "SELECT 'Outstanding Balance Total' as check_type, SUM(outstandingBalance) as total FROM customers;"
  );
  sqlLines.push(
    "SELECT 'Credit Balance Total' as check_type, SUM(credit_balance) as total FROM customers;"
  );

  const sql = sqlLines.join("\n");
  fs.writeFileSync("balance-corrections.sql", sql);

  console.log("\n📄 SQL script generated: balance-corrections.sql");
  console.log("You can review and run this script manually if preferred.");
}

function main() {
  const args = process.argv.slice(2);
  const shouldApply = args.includes("--apply");
  const shouldGenerateSQL = args.includes("--sql");

  if (args.includes("--help")) {
    console.log(`
Balance Reconciliation Tool

Usage: node scripts/reconcile-exported-balance.js [options]

Options:
  --apply    Actually apply the corrections (default: dry run)
  --sql      Generate SQL script for manual review
  --help     Show this help message

Examples:
  node scripts/reconcile-exported-balance.js           # Dry run
  node scripts/reconcile-exported-balance.js --apply   # Apply fixes
  node scripts/reconcile-exported-balance.js --sql     # Generate SQL
    `);
    return;
  }

  // Make a backup copy if we're applying changes
  if (shouldApply) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `assets/klyntl-export-backup-${timestamp}.db`;
    fs.copyFileSync("assets/klyntl-export-1757424500055.db", backupPath);
    console.log(`📄 Backup created: ${backupPath}\n`);
  }

  const db = new Database("assets/klyntl-export-1757424500055.db", {
    readonly: !shouldApply,
  });

  try {
    const corrections = calculateCorrectBalances(db);
    showCorrections(corrections);

    if (shouldGenerateSQL) {
      generateSQLScript(corrections);
    }

    applyCorrections(db, corrections, !shouldApply);

    if (shouldApply && corrections.length > 0) {
      console.log("\n=== VERIFICATION ===");
      // Re-run analysis to verify
      const newCorrections = calculateCorrectBalances(db);
      if (newCorrections.length === 0) {
        console.log("✅ All balance discrepancies have been fixed!");
      } else {
        console.log(`❌ ${newCorrections.length} discrepancies still remain`);
      }
    }
  } catch (error) {
    console.error("Error during reconciliation:", error);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main();
}
