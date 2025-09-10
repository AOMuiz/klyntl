#!/usr/bin/env node

/**
 * Comprehensive Database Test for Exported Klyntl Database
 *
 * This script tests the exported database from the device to identify
 * discrepancies and verify data integrity.
 */

const fs = require("fs");
const argv = require("minimist")(process.argv.slice(2));

// Try to require better-sqlite3
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

function showDatabaseInfo(db) {
  console.log("=== Database Information ===");

  // Check table structure
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();
  console.log(`Tables found: ${tables.map((t) => t.name).join(", ")}`);

  // Check customers table structure
  const customerCols = db.prepare("PRAGMA table_info(customers)").all();
  console.log("\nCustomers table columns:");
  customerCols.forEach((col) => {
    console.log(
      `  - ${col.name}: ${col.type} ${col.notnull ? "NOT NULL" : ""} ${
        col.dflt_value ? `DEFAULT ${col.dflt_value}` : ""
      }`
    );
  });

  // Check transactions table structure
  const transactionCols = db.prepare("PRAGMA table_info(transactions)").all();
  console.log("\nTransactions table columns:");
  transactionCols.forEach((col) => {
    console.log(
      `  - ${col.name}: ${col.type} ${col.notnull ? "NOT NULL" : ""} ${
        col.dflt_value ? `DEFAULT ${col.dflt_value}` : ""
      }`
    );
  });
}

function showSummary(db) {
  console.log("\n=== Database Summary ===");

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

  // Use the same calculation logic as our working reconciliation script
  const allCustomers = db
    .prepare(
      `
      SELECT 
        c.id,
        c.name,
        c.outstandingBalance as stored_balance,
        c.credit_balance as stored_credit
      FROM customers c
    `
    )
    .all();

  const discrepancies = [];

  for (const customer of allCustomers) {
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

    let computedBalance = 0;
    for (const tx of transactions) {
      if (tx.type === "sale" || tx.type === "credit") {
        computedBalance += tx.remainingAmount || tx.amount;
      } else if (tx.type === "payment" && tx.appliedToDebt === 1) {
        computedBalance -= tx.amount;
      } else if (tx.type === "refund") {
        computedBalance -= tx.amount;
      }
    }
    computedBalance = Math.max(0, computedBalance);

    if (customer.stored_balance !== computedBalance) {
      discrepancies.push({
        id: customer.id,
        name: customer.name,
        stored_balance: customer.stored_balance,
        stored_credit: customer.stored_credit,
        computed_balance: computedBalance,
        transaction_count: transactions.length,
      });
    }
  }

  discrepancies.sort(
    (a, b) =>
      Math.abs(b.computed_balance - b.stored_balance) -
      Math.abs(a.computed_balance - a.stored_balance)
  );

  if (discrepancies.length === 0) {
    console.log("✅ No balance discrepancies found!");
  } else {
    console.log(
      `❌ Found ${discrepancies.length} customers with balance discrepancies:\n`
    );

    console.table(
      discrepancies.map((d) => ({
        ID: d.id.substring(0, 12) + "...",
        Name: d.name,
        "Stored Balance": formatCurrency(d.stored_balance),
        "Computed Balance": formatCurrency(d.computed_balance),
        Difference: formatCurrency(d.computed_balance - d.stored_balance),
        Credit: formatCurrency(d.stored_credit),
        Transactions: d.transaction_count,
      }))
    );

    const totalDifference = discrepancies.reduce(
      (sum, d) => sum + (d.computed_balance - d.stored_balance),
      0
    );

    console.log(`\nTotal difference: ${formatCurrency(totalDifference)}`);
  }

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
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
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

  // Check for orphaned transactions
  const orphanedTx = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM transactions t
      LEFT JOIN customers c ON t.customerId = c.id
      WHERE c.id IS NULL AND t.isDeleted = 0
    `
    )
    .get();

  console.log(`Orphaned transactions: ${orphanedTx.count}`);

  // Check for customers with no transactions
  const customersNoTx = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customerId AND t.isDeleted = 0
      WHERE t.id IS NULL
    `
    )
    .get();

  console.log(`Customers with no transactions: ${customersNoTx.count}`);

  // Check for negative amounts
  const negativeAmounts = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE amount < 0 AND isDeleted = 0
    `
    )
    .get();

  console.log(`Transactions with negative amounts: ${negativeAmounts.count}`);

  // Check for inconsistent transaction status
  const inconsistentStatus = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE isDeleted = 0
        AND (
          (remainingAmount = 0 AND status != 'completed') OR
          (remainingAmount > 0 AND remainingAmount < amount AND status != 'partial') OR
          (remainingAmount >= amount AND status != 'pending')
        )
    `
    )
    .get();

  console.log(
    `Transactions with inconsistent status: ${inconsistentStatus.count}`
  );
}

function analyzeSpecificCustomer(db, customerId) {
  console.log(`\n=== Customer Analysis: ${customerId} ===`);

  const customer = db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(customerId);

  if (!customer) {
    console.error(`Customer not found: ${customerId}`);
    return;
  }

  console.log(`Name: ${customer.name}`);
  console.log(`Phone: ${customer.phone}`);
  console.log(
    `Stored Outstanding Balance: ${formatCurrency(customer.outstandingBalance)}`
  );
  console.log(`Credit Balance: ${formatCurrency(customer.credit_balance)}`);
  console.log(`Total Spent: ${formatCurrency(customer.totalSpent)}`);

  // Get all transactions for this customer
  const transactions = db
    .prepare(
      `
      SELECT * FROM transactions 
      WHERE customerId = ? AND isDeleted = 0 
      ORDER BY date ASC
    `
    )
    .all(customerId);

  console.log(`\nTransactions (${transactions.length}):`);

  let runningBalance = 0;
  transactions.forEach((tx, index) => {
    let impact = 0;
    if (tx.type === "sale" || tx.type === "credit") {
      impact = tx.remainingAmount || tx.amount || 0;
    } else if (tx.type === "payment" && tx.appliedToDebt) {
      impact = -(tx.amount || 0);
    } else if (tx.type === "refund") {
      impact = -(tx.amount || 0);
    }

    runningBalance += impact;

    console.log(
      `${index + 1}. ${tx.date.substring(0, 16)} | ${tx.type.padEnd(
        8
      )} | Amount: ${formatCurrency(tx.amount).padEnd(
        12
      )} | Remaining: ${formatCurrency(tx.remainingAmount || 0).padEnd(
        12
      )} | Impact: ${formatCurrency(impact).padEnd(
        12
      )} | Balance: ${formatCurrency(Math.max(0, runningBalance))}`
    );
  });

  const computedBalance = Math.max(0, runningBalance);
  console.log(
    `\nStored Outstanding Balance: ${formatCurrency(
      customer.outstandingBalance
    )}`
  );
  console.log(`Computed Balance: ${formatCurrency(computedBalance)}`);
  console.log(
    `Difference: ${formatCurrency(
      computedBalance - customer.outstandingBalance
    )}`
  );

  if (computedBalance !== customer.outstandingBalance) {
    console.log(`❌ DISCREPANCY DETECTED!`);
  } else {
    console.log(`✅ Balance matches`);
  }
}

function findProblematicCustomers(db, limit = 5) {
  console.log(`\n=== Top ${limit} Problematic Customers ===`);

  const problematic = db
    .prepare(
      `
      SELECT 
        c.id,
        c.name,
        c.outstandingBalance as stored_balance,
        COALESCE(SUM(CASE 
          WHEN t.type IN ('sale', 'credit') THEN COALESCE(t.remainingAmount, t.amount)
          WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN -t.amount
          WHEN t.type = 'refund' THEN -t.amount
          ELSE 0 
        END), 0) as computed_balance,
        COUNT(t.id) as transaction_count
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customerId AND t.isDeleted = 0
      GROUP BY c.id, c.name, c.outstandingBalance
      HAVING stored_balance != computed_balance
      ORDER BY ABS(stored_balance - computed_balance) DESC
      LIMIT ?
    `
    )
    .all(limit);

  if (problematic.length === 0) {
    console.log("No problematic customers found!");
    return;
  }

  problematic.forEach((customer, index) => {
    console.log(
      `\n${index + 1}. ${customer.name} (${customer.id.substring(0, 12)}...)`
    );
    console.log(`   Stored: ${formatCurrency(customer.stored_balance)}`);
    console.log(`   Computed: ${formatCurrency(customer.computed_balance)}`);
    console.log(
      `   Difference: ${formatCurrency(
        customer.computed_balance - customer.stored_balance
      )}`
    );
    console.log(`   Transactions: ${customer.transaction_count}`);
  });

  return problematic;
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
Klyntl Exported Database Test Tool

Usage: node scripts/test-exported-db.js [database-file] [options]

Options:
  --customer <id>    Analyze specific customer
  --recent <n>       Show recent N transactions (default: 10)
  --problems <n>     Show top N problematic customers (default: 5)
  --help             Show this help message

Examples:
  node scripts/test-exported-db.js
  node scripts/test-exported-db.js --customer cust_123
  node scripts/test-exported-db.js --recent 20
    `);
    return;
  }

  console.log(`Testing exported database: ${dbFile}\n`);

  const db = openDatabase(dbFile);

  try {
    showDatabaseInfo(db);
    showSummary(db);

    const discrepancies = checkBalanceDiscrepancies(db);

    analyzeTransactionTypes(db);
    analyzePaymentApplication(db);
    checkDataIntegrity(db);

    if (argv.customer) {
      analyzeSpecificCustomer(db, argv.customer);
    }

    const recentLimit = argv.recent || 10;
    showRecentTransactions(db, recentLimit);

    const problemLimit = argv.problems || 5;
    const problematic = findProblematicCustomers(db, problemLimit);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("SUMMARY");
    console.log("=".repeat(50));

    if (discrepancies.length === 0) {
      console.log(
        "✅ No balance discrepancies found - database appears healthy!"
      );
    } else {
      console.log(
        `❌ Found ${discrepancies.length} customers with balance discrepancies`
      );
      console.log("   Consider running reconciliation to fix these issues");
    }

    if (problematic && problematic.length > 0) {
      console.log(
        `\n🔍 Detailed analysis available for ${problematic.length} problematic customers`
      );
      console.log("   Use --customer <id> to analyze specific customers");
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main();
}
