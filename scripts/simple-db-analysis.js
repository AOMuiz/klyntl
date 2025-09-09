#!/usr/bin/env node

/**
 * Simplified Database Analysis Tool for Klyntl
 *
 * This script works without external dependencies by generating SQL commands
 * that you can run with sqlite3 to analyze the database.
 *
 * Usage:
 *   node scripts/simple-db-analysis.js
 */

function generateAnalysisQueries() {
  const queries = {
    balanceCheck: `
-- Check for balance discrepancies between stored and computed balances
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
  (COALESCE(SUM(CASE 
    WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount 
    WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN -t.amount
    WHEN t.type = 'refund' THEN -t.amount
    ELSE 0 
  END), 0) - c.outstandingBalance) as difference,
  COUNT(t.id) as transaction_count
FROM customers c
LEFT JOIN transactions t ON c.id = t.customerId AND t.isDeleted = 0
GROUP BY c.id, c.name, c.outstandingBalance
HAVING stored_balance != computed_balance
ORDER BY ABS(difference) DESC;
`,

    summary: `
-- Database summary statistics
SELECT 'Customers' as metric, COUNT(*) as count FROM customers
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions WHERE isDeleted = 0
UNION ALL
SELECT 'Total Sales (kobo)', COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'sale' AND isDeleted = 0
UNION ALL
SELECT 'Total Outstanding (kobo)', COALESCE(SUM(outstandingBalance), 0) FROM customers
UNION ALL
SELECT 'Total Credit (kobo)', COALESCE(SUM(creditBalance), 0) FROM customers;
`,

    customerDetails: `
-- Detailed customer analysis (replace 'CUSTOMER_ID' with actual ID)
SELECT 
  'Customer Info:' as section,
  c.name as value,
  c.outstandingBalance as stored_balance,
  c.creditBalance
FROM customers c 
WHERE c.id = 'CUSTOMER_ID'

UNION ALL

SELECT 
  'Transaction Analysis:',
  t.date || ' | ' || t.type || ' | ' || CAST(t.amount/100.0 AS TEXT) || 'NGN',
  CASE 
    WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount 
    WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN -t.amount
    WHEN t.type = 'refund' THEN -t.amount
    ELSE 0 
  END,
  ''
FROM transactions t
WHERE t.customerId = 'CUSTOMER_ID' AND t.isDeleted = 0
ORDER BY t.date ASC;
`,

    reconcileFix: `
-- SQL commands to fix balance discrepancies
-- WARNING: This will modify your database. Make a backup first!

UPDATE customers 
SET outstandingBalance = (
  SELECT COALESCE(SUM(CASE 
    WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount 
    WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN -t.amount
    WHEN t.type = 'refund' THEN -t.amount
    ELSE 0 
  END), 0)
  FROM transactions t 
  WHERE t.customerId = customers.id AND t.isDeleted = 0
),
updatedAt = datetime('now')
WHERE EXISTS (
  SELECT 1 FROM transactions t 
  WHERE t.customerId = customers.id AND t.isDeleted = 0
);

-- Fix transaction statuses based on remaining amounts
UPDATE transactions 
SET status = CASE 
  WHEN COALESCE(remainingAmount,0) = 0 THEN 'completed'
  WHEN COALESCE(remainingAmount,0) > 0 AND COALESCE(remainingAmount,0) < amount THEN 'partial'
  WHEN COALESCE(remainingAmount,0) >= amount THEN 'pending'
  ELSE status 
END
WHERE isDeleted = 0;
`,
  };

  return queries;
}

function main() {
  console.log("=== Klyntl Database Analysis Tool ===\n");

  const queries = generateAnalysisQueries();

  console.log(
    "This tool generates SQL queries that you can run with sqlite3 to analyze your database.\n"
  );

  console.log("📊 USAGE INSTRUCTIONS:");
  console.log(
    "1. First export your database from the app using the DatabaseDebugScreen"
  );
  console.log("2. Copy the exported .db file to your computer");
  console.log("3. Run the SQL queries below with sqlite3\n");

  console.log("💡 EXAMPLE COMMANDS:");
  console.log('   sqlite3 your-exported-db.db "SQL_QUERY_HERE"');
  console.log("   sqlite3 your-exported-db.db < analysis.sql\n");

  console.log("🔍 1. CHECK FOR BALANCE DISCREPANCIES:");
  console.log("----------------------------------------");
  console.log(queries.balanceCheck);

  console.log("\n📈 2. DATABASE SUMMARY:");
  console.log("------------------------");
  console.log(queries.summary);

  console.log("\n👤 3. ANALYZE SPECIFIC CUSTOMER:");
  console.log("(Replace CUSTOMER_ID with actual customer ID)");
  console.log("----------------------------------------------");
  console.log(queries.customerDetails);

  console.log("\n🔧 4. FIX BALANCE DISCREPANCIES:");
  console.log("⚠️  WARNING: This modifies your database! Backup first!");
  console.log("--------------------------------------------------------");
  console.log(queries.reconcileFix);

  console.log("\n✅ To save these queries to files, run:");
  console.log("   node scripts/simple-db-analysis.js > analysis-queries.sql");

  console.log("\n🎯 QUICK TEST EXAMPLE:");
  console.log("If you want to test with sample data, run:");
  console.log("   sqlite3 test.db");
  console.log(
    "   -- Then paste the CREATE and INSERT statements from the balance check query"
  );

  // Generate a sample test database
  console.log("\n📝 SAMPLE TEST DATABASE COMMANDS:");
  console.log("----------------------------------");
  console.log(`
-- Create test database with balance discrepancy
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  outstandingBalance INTEGER,
  creditBalance INTEGER
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  customerId TEXT,
  amount INTEGER,
  remainingAmount INTEGER,
  type TEXT,
  paymentMethod TEXT,
  appliedToDebt INTEGER,
  date TEXT,
  isDeleted INTEGER DEFAULT 0
);

-- Customer that should owe ₦4,000 but stored balance shows ₦6,000
INSERT INTO customers VALUES ('cust_001', 'John Doe', 600000, 0);

-- Transactions: ₦3,000 + ₦2,000 - ₦1,000 = ₦4,000 (but stored shows ₦6,000)
INSERT INTO transactions VALUES 
('txn_1', 'cust_001', 300000, 300000, 'sale', 'credit', 0, '2024-01-01', 0),
('txn_2', 'cust_001', 200000, 200000, 'sale', 'credit', 0, '2024-01-02', 0),
('txn_3', 'cust_001', 100000, 0, 'payment', 'cash', 1, '2024-01-03', 0);

-- Now run the balance check query to see the discrepancy!
`);
}

if (require.main === module) {
  main();
}
