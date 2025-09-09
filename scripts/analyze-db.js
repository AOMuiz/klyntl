#!/usr/bin/env node

/**
 * Local Database Analysis Tool for Klyntl
 *
 * This script works with exported SQLite databases from the Klyntl app.
 *
 * Usage:
 *   node scripts/analyze-db.js <path-to-db-file> [options]
 *
 * Options:
 *   --balance-check    Check for balance discrepancies
 *   --reconcile       Fix balance discrepancies (writes to DB)
 *   --export-csv      Export data to CSV files
 *   --summary         Show database summary
 *   --customer <id>   Analyze specific customer
 *
 * Examples:
 *   node scripts/analyze-db.js ./klyntl-export.db --balance-check
 *   node scripts/analyze-db.js ./klyntl-export.db --customer cust_123
 *   node scripts/analyze-db.js ./klyntl-export.db --reconcile
 */

const fs = require("fs");
const path = require("path");
const argv = require("minimist")(process.argv.slice(2));

// Try to require better-sqlite3, fall back to instructions if not available
let Database;
try {
  Database = require("better-sqlite3");
} catch (error) {
  console.error("better-sqlite3 not found. Please install it:");
  console.error("npm install better-sqlite3");
  process.exit(1);
}

function openDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found: ${dbPath}`);
    process.exit(1);
  }

  return new Database(dbPath, {
    readonly: argv.reconcile ? false : true,
  });
}

function formatCurrency(amount) {
  return `₦${(amount / 100).toLocaleString()}`;
}

function showHelp() {
  console.log(`
Klyntl Database Analysis Tool

Usage: node scripts/analyze-db.js <database-file> [options]

Options:
  --balance-check     Check for balance discrepancies between stored and computed values
  --reconcile        Fix balance discrepancies (modifies database)
  --export-csv       Export customers and transactions to CSV files
  --summary          Show database summary statistics
  --customer <id>    Analyze specific customer transactions
  --transactions     Show recent transactions
  --help             Show this help message

Examples:
  node scripts/analyze-db.js ./exported-db.db --balance-check
  node scripts/analyze-db.js ./exported-db.db --customer cust_123
  node scripts/analyze-db.js ./exported-db.db --reconcile
  `);
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
    .prepare("SELECT COALESCE(SUM(creditBalance), 0) as total FROM customers")
    .get();

  console.log(`Customers: ${customerCount.count}`);
  console.log(`Transactions: ${transactionCount.count}`);
  console.log(`Total Sales: ${formatCurrency(totalSales.total)}`);
  console.log(`Total Outstanding: ${formatCurrency(totalOutstanding.total)}`);
  console.log(`Total Credit: ${formatCurrency(totalCredit.total)}`);
}

function checkBalanceDiscrepancies(db) {
  console.log("=== Balance Discrepancy Check ===");

  const discrepancies = db
    .prepare(
      `
    SELECT 
      c.id,
      c.name,
      c.outstandingBalance as stored_balance,
      COALESCE(SUM(CASE 
        WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount 
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
  `
    )
    .all();

  if (discrepancies.length === 0) {
    console.log("✅ No balance discrepancies found!");
    return;
  }

  console.log(
    `❌ Found ${discrepancies.length} customers with balance discrepancies:\n`
  );

  console.table(
    discrepancies.map((d) => ({
      ID: d.id,
      Name: d.name,
      Stored: formatCurrency(d.stored_balance),
      Computed: formatCurrency(d.computed_balance),
      Difference: formatCurrency(d.computed_balance - d.stored_balance),
      Transactions: d.transaction_count,
    }))
  );

  const totalDifference = discrepancies.reduce(
    (sum, d) => sum + (d.computed_balance - d.stored_balance),
    0
  );

  console.log(`\nTotal difference: ${formatCurrency(totalDifference)}`);
}

function analyzeCustomer(db, customerId) {
  console.log(`=== Customer Analysis: ${customerId} ===`);

  const customer = db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(customerId);

  if (!customer) {
    console.error(`Customer not found: ${customerId}`);
    return;
  }

  console.log(`Name: ${customer.name}`);
  console.log(`Phone: ${customer.phone}`);
  console.log(`Stored Balance: ${formatCurrency(customer.outstandingBalance)}`);
  console.log(`Credit Balance: ${formatCurrency(customer.creditBalance)}`);
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
  transactions.forEach((tx) => {
    let impact = 0;
    if (tx.type === "sale" || tx.type === "credit") {
      impact = tx.remainingAmount || 0;
    } else if (tx.type === "payment" && tx.appliedToDebt) {
      impact = -(tx.amount || 0);
    } else if (tx.type === "refund") {
      impact = -(tx.amount || 0);
    }

    runningBalance += impact;

    console.log(
      `${tx.date.substring(0, 10)} | ${tx.type.padEnd(8)} | ${formatCurrency(
        tx.amount
      ).padEnd(12)} | Impact: ${formatCurrency(impact).padEnd(
        12
      )} | Balance: ${formatCurrency(Math.max(0, runningBalance))}`
    );
  });

  const computedBalance = Math.max(0, runningBalance);
  console.log(
    `\nStored Balance:   ${formatCurrency(customer.outstandingBalance)}`
  );
  console.log(`Computed Balance: ${formatCurrency(computedBalance)}`);
  console.log(
    `Difference:       ${formatCurrency(
      computedBalance - customer.outstandingBalance
    )}`
  );
}

function reconcileBalances(db) {
  console.log("=== Reconciling Balance Discrepancies ===");

  const customers = db.prepare("SELECT id FROM customers").all();
  const now = new Date().toISOString();

  const updateStmt = db.prepare(`
    UPDATE customers 
    SET outstandingBalance = ?, updatedAt = ? 
    WHERE id = ?
  `);

  let fixedCount = 0;

  const transaction = db.transaction((customers) => {
    for (const customer of customers) {
      const result = db
        .prepare(
          `
        SELECT COALESCE(SUM(CASE 
          WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount 
          WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN -t.amount
          WHEN t.type = 'refund' THEN -t.amount
          ELSE 0 
        END), 0) as computed_balance
        FROM transactions t 
        WHERE t.customerId = ? AND t.isDeleted = 0
      `
        )
        .get(customer.id);

      const computedBalance = Math.max(0, result.computed_balance);
      updateStmt.run(computedBalance, now, customer.id);
      fixedCount++;
    }
  });

  transaction(customers);

  console.log(`✅ Updated ${fixedCount} customer balances`);

  // Also fix transaction statuses
  db.prepare(
    `
    UPDATE transactions 
    SET status = CASE 
      WHEN COALESCE(remainingAmount,0) = 0 THEN 'completed'
      WHEN COALESCE(remainingAmount,0) > 0 AND COALESCE(remainingAmount,0) < amount THEN 'partial'
      WHEN COALESCE(remainingAmount,0) >= amount THEN 'pending'
      ELSE status 
    END
    WHERE isDeleted = 0
  `
  ).run();

  console.log("✅ Updated transaction statuses");
}

function exportToCsv(db) {
  console.log("=== Exporting to CSV ===");

  // Export customers
  const customers = db
    .prepare(
      `
    SELECT 
      id, name, phone, email, 
      outstandingBalance/100.0 as outstanding_ngn,
      creditBalance/100.0 as credit_ngn,
      totalSpent/100.0 as total_spent_ngn,
      createdAt, updatedAt
    FROM customers
    ORDER BY name
  `
    )
    .all();

  const customersCsv = [
    "ID,Name,Phone,Email,Outstanding (₦),Credit (₦),Total Spent (₦),Created,Updated",
    ...customers.map(
      (c) =>
        `"${c.id}","${c.name}","${c.phone || ""}","${c.email || ""}",${
          c.outstanding_ngn
        },${c.credit_ngn},${c.total_spent_ngn},"${c.createdAt}","${
          c.updatedAt
        }"`
    ),
  ].join("\n");

  fs.writeFileSync("customers.csv", customersCsv);

  // Export transactions
  const transactions = db
    .prepare(
      `
    SELECT 
      t.id, t.customerId, c.name as customerName,
      t.type, t.amount/100.0 as amount_ngn, 
      t.paidAmount/100.0 as paid_ngn,
      t.remainingAmount/100.0 as remaining_ngn,
      t.paymentMethod, t.status, t.appliedToDebt,
      t.date, t.description
    FROM transactions t
    LEFT JOIN customers c ON t.customerId = c.id
    WHERE t.isDeleted = 0
    ORDER BY t.date DESC
  `
    )
    .all();

  const transactionsCsv = [
    "ID,Customer ID,Customer Name,Type,Amount (₦),Paid (₦),Remaining (₦),Payment Method,Status,Applied to Debt,Date,Description",
    ...transactions.map(
      (t) =>
        `"${t.id}","${t.customerId}","${t.customerName || ""}","${t.type}",${
          t.amount_ngn
        },${t.paid_ngn || 0},${t.remaining_ngn || 0},"${t.paymentMethod}","${
          t.status
        }",${t.appliedToDebt ? "Yes" : "No"},"${t.date}","${
          t.description || ""
        }"`
    ),
  ].join("\n");

  fs.writeFileSync("transactions.csv", transactionsCsv);

  console.log("✅ Exported customers.csv and transactions.csv");
}

function showRecentTransactions(db) {
  console.log("=== Recent Transactions ===");

  const transactions = db
    .prepare(
      `
    SELECT 
      t.date, t.type, c.name as customer,
      t.amount, t.remainingAmount, t.status
    FROM transactions t
    LEFT JOIN customers c ON t.customerId = c.id
    WHERE t.isDeleted = 0
    ORDER BY t.date DESC
    LIMIT 20
  `
    )
    .all();

  console.table(
    transactions.map((t) => ({
      Date: t.date.substring(0, 10),
      Type: t.type,
      Customer: t.customer || "Unknown",
      Amount: formatCurrency(t.amount),
      Remaining: formatCurrency(t.remainingAmount || 0),
      Status: t.status,
    }))
  );
}

function main() {
  const dbFile = argv._[0];

  if (argv.help || !dbFile) {
    showHelp();
    return;
  }

  const db = openDatabase(dbFile);

  try {
    console.log(`Analyzing database: ${dbFile}\n`);

    if (
      argv.summary ||
      (!argv["balance-check"] &&
        !argv.reconcile &&
        !argv["export-csv"] &&
        !argv.customer &&
        !argv.transactions)
    ) {
      showSummary(db);
      console.log();
    }

    if (argv["balance-check"]) {
      checkBalanceDiscrepancies(db);
      console.log();
    }

    if (argv.customer) {
      analyzeCustomer(db, argv.customer);
      console.log();
    }

    if (argv.transactions) {
      showRecentTransactions(db);
      console.log();
    }

    if (argv["export-csv"]) {
      exportToCsv(db);
      console.log();
    }

    if (argv.reconcile) {
      if (argv.readonly !== false) {
        console.log(
          "Warning: This will modify the database. Add --readonly=false to confirm."
        );
      } else {
        reconcileBalances(db);
      }
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main();
}
