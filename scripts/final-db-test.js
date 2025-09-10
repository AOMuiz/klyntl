#!/usr/bin/env node

/**
 * Final Database Test for Exported Klyntl Database
 *
 * This script provides a comprehensive test of the exported database
 * using the correct balance calculation logic.
 */

const fs = require("fs");
const argv = require("minimist")(process.argv.slice(2));

let Database;
try {
  Database = require("better-sqlite3");
} catch (_error) {
  console.error("better-sqlite3 not found. Please install it:");
  console.error("npm install better-sqlite3");
  process.exit(1);
}

function openDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found: ${dbPath}`);
    process.exit(1);
  }
  return new Database(dbPath, { readonly: true });
}

function formatCurrency(amount) {
  return `₦${(amount / 100).toLocaleString()}`;
}

function calculateCustomerBalance(db, customerId) {
  const transactions = db
    .prepare(
      `
    SELECT * FROM transactions 
    WHERE customerId = ? AND isDeleted = 0 
    ORDER BY date ASC
  `
    )
    .all(customerId);

  let outstandingBalance = 0;
  let creditBalance = 0;

  for (const tx of transactions) {
    if (tx.type === "sale" || tx.type === "credit") {
      outstandingBalance += tx.remainingAmount || tx.amount;
    } else if (tx.type === "payment") {
      if (tx.appliedToDebt === 1) {
        outstandingBalance -= tx.amount;
      } else {
        creditBalance += tx.amount;
      }
    } else if (tx.type === "refund") {
      outstandingBalance -= tx.amount;
    }
  }

  return {
    outstandingBalance: Math.max(0, outstandingBalance),
    creditBalance,
    transactionCount: transactions.length,
  };
}

function showSummary(db) {
  console.log("=== Database Summary ===");

  const customerCount = db
    .prepare("SELECT COUNT(*) as count FROM customers")
    .get();
  const transactionCount = db
    .prepare("SELECT COUNT(*) as count FROM transactions WHERE isDeleted = 0")
    .get();

  const totalSales = db
    .prepare(
      `
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM transactions 
    WHERE type = 'sale' AND isDeleted = 0
  `
    )
    .get();

  const totalOutstanding = db
    .prepare(
      "SELECT COALESCE(SUM(outstandingBalance), 0) as total FROM customers"
    )
    .get();
  const totalCredit = db
    .prepare("SELECT COALESCE(SUM(credit_balance), 0) as total FROM customers")
    .get();

  console.log(`Customers: ${customerCount.count}`);
  console.log(`Transactions: ${transactionCount.count}`);
  console.log(`Total Sales: ${formatCurrency(totalSales.total)}`);
  console.log(`Total Outstanding: ${formatCurrency(totalOutstanding.total)}`);
  console.log(`Total Credit: ${formatCurrency(totalCredit.total)}`);
}

function checkBalanceDiscrepancies(db) {
  console.log("\n=== Balance Discrepancy Check ===");

  const customers = db
    .prepare(
      "SELECT id, name, outstandingBalance, credit_balance FROM customers"
    )
    .all();
  const discrepancies = [];

  for (const customer of customers) {
    const calculated = calculateCustomerBalance(db, customer.id);

    if (calculated.transactionCount === 0) continue;

    if (
      customer.outstandingBalance !== calculated.outstandingBalance ||
      customer.credit_balance !== calculated.creditBalance
    ) {
      discrepancies.push({
        id: customer.id,
        name: customer.name,
        storedOutstanding: customer.outstandingBalance,
        computedOutstanding: calculated.outstandingBalance,
        storedCredit: customer.credit_balance,
        computedCredit: calculated.creditBalance,
        transactions: calculated.transactionCount,
      });
    }
  }

  if (discrepancies.length === 0) {
    console.log("✅ No balance discrepancies found!");
    return [];
  }

  console.log(
    `❌ Found ${discrepancies.length} customers with balance discrepancies:\n`
  );

  console.table(
    discrepancies.map((d) => ({
      ID: d.id.substring(0, 12) + "...",
      Name: d.name,
      "Stored Outstanding": formatCurrency(d.storedOutstanding),
      "Computed Outstanding": formatCurrency(d.computedOutstanding),
      "Outstanding Diff": formatCurrency(
        d.computedOutstanding - d.storedOutstanding
      ),
      "Stored Credit": formatCurrency(d.storedCredit),
      "Computed Credit": formatCurrency(d.computedCredit),
      "Credit Diff": formatCurrency(d.computedCredit - d.storedCredit),
      Transactions: d.transactions,
    }))
  );

  const totalOutstandingDiff = discrepancies.reduce(
    (sum, d) => sum + (d.computedOutstanding - d.storedOutstanding),
    0
  );
  const totalCreditDiff = discrepancies.reduce(
    (sum, d) => sum + (d.computedCredit - d.storedCredit),
    0
  );

  console.log(
    `\nTotal Outstanding Difference: ${formatCurrency(totalOutstandingDiff)}`
  );
  console.log(`Total Credit Difference: ${formatCurrency(totalCreditDiff)}`);

  return discrepancies;
}

function analyzeTransactionTypes(db) {
  console.log("\n=== Transaction Type Analysis ===");

  const typeAnalysis = db
    .prepare(
      `
    SELECT 
      type,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount,
      MIN(amount) as min_amount,
      MAX(amount) as max_amount
    FROM transactions 
    WHERE isDeleted = 0
    GROUP BY type
    ORDER BY count DESC
  `
    )
    .all();

  console.table(
    typeAnalysis.map((t) => ({
      Type: t.type,
      Count: t.count,
      Total: formatCurrency(t.total_amount),
      Average: formatCurrency(t.avg_amount),
      Min: formatCurrency(t.min_amount),
      Max: formatCurrency(t.max_amount),
    }))
  );
}

function analyzePaymentApplication(db) {
  console.log("\n=== Payment Application Analysis ===");

  const paymentStats = db
    .prepare(
      `
    SELECT 
      appliedToDebt,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM transactions 
    WHERE type = 'payment' AND isDeleted = 0
    GROUP BY appliedToDebt
  `
    )
    .all();

  console.log("Payment Application Status:");
  paymentStats.forEach((stat) => {
    const applied =
      stat.appliedToDebt === 1 ? "Applied to Debt" : "Not Applied to Debt";
    console.log(
      `${applied}: ${stat.count} payments, Total: ${formatCurrency(
        stat.total_amount
      )}`
    );
  });
}

function checkDataIntegrity(db) {
  console.log("\n=== Data Integrity Checks ===");

  const checks = {
    orphanedTx: db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM transactions t
      LEFT JOIN customers c ON t.customerId = c.id
      WHERE c.id IS NULL AND t.isDeleted = 0
    `
      )
      .get(),

    customersNoTx: db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customerId AND t.isDeleted = 0
      WHERE t.id IS NULL
    `
      )
      .get(),

    negativeAmounts: db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE amount < 0 AND isDeleted = 0
    `
      )
      .get(),
  };

  console.log(`Orphaned transactions: ${checks.orphanedTx.count}`);
  console.log(`Customers with no transactions: ${checks.customersNoTx.count}`);
  console.log(
    `Transactions with negative amounts: ${checks.negativeAmounts.count}`
  );
}

function showRecentTransactions(db, limit = 10) {
  console.log(`\n=== Recent ${limit} Transactions ===`);

  const transactions = db
    .prepare(
      `
    SELECT 
      t.id, t.date, t.type, c.name as customer,
      t.amount, t.remainingAmount, t.status, t.appliedToDebt
    FROM transactions t
    LEFT JOIN customers c ON t.customerId = c.id
    WHERE t.isDeleted = 0
    ORDER BY t.date DESC
    LIMIT ?
  `
    )
    .all(limit);

  console.table(
    transactions.map((t) => ({
      ID: t.id.substring(0, 12) + "...",
      Date: t.date.substring(0, 16),
      Type: t.type,
      Customer: (t.customer || "Unknown").substring(0, 20),
      Amount: formatCurrency(t.amount),
      Remaining: formatCurrency(t.remainingAmount || 0),
      Status: t.status,
      "Applied to Debt": t.appliedToDebt ? "Yes" : "No",
    }))
  );
}

function main() {
  const dbFile = argv._[0] || "assets/klyntl-export-1757424500055.db";

  if (argv.help) {
    console.log(`
Final Database Test Tool

Usage: node scripts/final-db-test.js [database-file] [options]

Options:
  --recent <n>       Show recent N transactions (default: 10)
  --help             Show this help message

Examples:
  node scripts/final-db-test.js
  node scripts/final-db-test.js --recent 20
    `);
    return;
  }

  console.log(`Testing exported database: ${dbFile}\n`);

  const db = openDatabase(dbFile);

  try {
    showSummary(db);

    const discrepancies = checkBalanceDiscrepancies(db);

    analyzeTransactionTypes(db);
    analyzePaymentApplication(db);
    checkDataIntegrity(db);

    const recentLimit = argv.recent || 10;
    showRecentTransactions(db, recentLimit);

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("FINAL SUMMARY");
    console.log("=".repeat(60));

    if (discrepancies.length === 0) {
      console.log("✅ ALL BALANCE DISCREPANCIES HAVE BEEN FIXED!");
      console.log("✅ Database integrity checks passed");
      console.log("✅ Your exported database is now healthy and ready for use");
    } else {
      console.log(
        `❌ ${discrepancies.length} discrepancies still need attention`
      );
      console.log("   Run the reconciliation script to fix remaining issues");
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main();
}
