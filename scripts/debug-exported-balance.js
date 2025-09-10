#!/usr/bin/env node

/**
 * Debug Balance Calculation for Exported Database
 *
 * This script will manually calculate the balance step-by-step
 * to identify the exact discrepancy source
 */

const Database = require("better-sqlite3");

function formatCurrency(amount) {
  return `₦${(amount / 100).toLocaleString()}`;
}

function analyzeCustomerBalance(db, customerId) {
  // Get customer info
  const customer = db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(customerId);
  if (!customer) {
    console.log(`Customer not found: ${customerId}`);
    return;
  }

  console.log(`=== Analyzing ${customer.name} ===`);
  console.log(`Customer ID: ${customerId}`);
  console.log(
    `Stored Outstanding Balance: ${formatCurrency(customer.outstandingBalance)}`
  );
  console.log(`Credit Balance: ${formatCurrency(customer.credit_balance)}`);
  console.log(`Total Spent: ${formatCurrency(customer.totalSpent)}`);

  // Get all transactions in chronological order
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

  let runningDebt = 0;
  let totalSales = 0;
  let totalPayments = 0;
  let totalCredits = 0;

  transactions.forEach((tx, index) => {
    let debtImpact = 0;
    let description = "";

    if (tx.type === "sale") {
      // Sales create debt
      debtImpact = tx.remainingAmount || tx.amount;
      totalSales += tx.amount;
      description = `Sale of ${formatCurrency(
        tx.amount
      )}, remaining debt: ${formatCurrency(tx.remainingAmount || tx.amount)}`;
    } else if (tx.type === "credit") {
      // Credits create debt that customer owes to store
      debtImpact = tx.remainingAmount || tx.amount;
      totalCredits += tx.amount;
      description = `Credit/loan of ${formatCurrency(
        tx.amount
      )}, remaining debt: ${formatCurrency(tx.remainingAmount || tx.amount)}`;
    } else if (tx.type === "payment") {
      if (tx.appliedToDebt === 1) {
        // Payment applied to debt reduces debt
        debtImpact = -tx.amount;
        totalPayments += tx.amount;
        description = `Payment of ${formatCurrency(tx.amount)} applied to debt`;
      } else {
        // Payment not applied to debt (goes to credit balance)
        debtImpact = 0;
        description = `Payment of ${formatCurrency(
          tx.amount
        )} NOT applied to debt (credit balance)`;
      }
    } else if (tx.type === "refund") {
      // Refunds reduce debt
      debtImpact = -tx.amount;
      description = `Refund of ${formatCurrency(tx.amount)}`;
    }

    runningDebt += debtImpact;

    console.log(`${index + 1}. ${tx.date}`);
    console.log(
      `   Type: ${tx.type} | Amount: ${formatCurrency(
        tx.amount
      )} | Applied to Debt: ${tx.appliedToDebt ? "Yes" : "No"}`
    );
    console.log(`   ${description}`);
    console.log(
      `   Debt Impact: ${formatCurrency(
        debtImpact
      )} | Running Debt: ${formatCurrency(Math.max(0, runningDebt))}`
    );
    console.log("");
  });

  const computedOutstanding = Math.max(0, runningDebt);

  console.log(`=== SUMMARY FOR ${customer.name} ===`);
  console.log(`Total Sales: ${formatCurrency(totalSales)}`);
  console.log(`Total Credits: ${formatCurrency(totalCredits)}`);
  console.log(
    `Total Payments Applied to Debt: ${formatCurrency(totalPayments)}`
  );
  console.log(
    `\nStored Outstanding Balance: ${formatCurrency(
      customer.outstandingBalance
    )}`
  );
  console.log(
    `Computed Outstanding Balance: ${formatCurrency(computedOutstanding)}`
  );
  console.log(
    `Difference: ${formatCurrency(
      computedOutstanding - customer.outstandingBalance
    )}`
  );

  if (computedOutstanding === customer.outstandingBalance) {
    console.log(`✅ Balance is CORRECT`);
  } else {
    console.log(`❌ Balance DISCREPANCY detected!`);

    if (computedOutstanding > customer.outstandingBalance) {
      console.log(`   Customer owes MORE than what's recorded`);
    } else {
      console.log(`   Customer owes LESS than what's recorded`);
    }
  }

  // Check credit balance logic
  const paymentsNotApplied = transactions
    .filter((tx) => tx.type === "payment" && tx.appliedToDebt === 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  console.log(`\nCREDIT BALANCE CHECK:`);
  console.log(
    `Payments not applied to debt: ${formatCurrency(paymentsNotApplied)}`
  );
  console.log(
    `Stored credit balance: ${formatCurrency(customer.credit_balance)}`
  );

  if (paymentsNotApplied === customer.credit_balance) {
    console.log(`✅ Credit balance is CORRECT`);
  } else {
    console.log(`❌ Credit balance DISCREPANCY!`);
  }

  return {
    customer,
    computedOutstanding,
    storedOutstanding: customer.outstandingBalance,
    difference: computedOutstanding - customer.outstandingBalance,
    transactions: transactions.length,
  };
}

function main() {
  const db = new Database("assets/klyntl-export-1757424500055.db", {
    readonly: true,
  });

  try {
    console.log("=== DETAILED BALANCE ANALYSIS ===\n");

    // Analyze both problematic customers
    const customer1 = analyzeCustomerBalance(db, "cust_1757423505406_qz9dhu4"); // A.Z Mcan Ipokia
    console.log("\n" + "=".repeat(60) + "\n");
    const customer2 = analyzeCustomerBalance(db, "cust_1757423505403_e3cq3my"); // A Z Akube

    console.log("\n" + "=".repeat(60));
    console.log("OVERALL SUMMARY");
    console.log("=".repeat(60));

    if (customer1 && customer2) {
      const totalDifference = customer1.difference + customer2.difference;
      console.log(
        `Total balance difference across both customers: ${formatCurrency(
          totalDifference
        )}`
      );

      if (Math.abs(totalDifference) > 0) {
        console.log(`❌ Database has balance discrepancies that need fixing`);
      } else {
        console.log(`✅ All balances are correct`);
      }
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main();
}
