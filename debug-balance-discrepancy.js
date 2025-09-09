#!/usr/bin/env node

/**
 * Debug script to identify balance discrepancy issue
 * This script will help us understand why the transaction details screen
 * shows ₦6,000 while customer details shows ₦4,000
 */

const path = require("path");

// Mock the database service for testing
const mockTransactions = [
  {
    id: "txn_1",
    customerId: "cust_123",
    type: "sale",
    amount: 300000, // ₦3,000
    remainingAmount: 300000,
    paymentMethod: "credit",
    status: "pending",
    date: "2024-01-01T00:00:00Z",
  },
  {
    id: "txn_2",
    customerId: "cust_123",
    type: "sale",
    amount: 200000, // ₦2,000
    remainingAmount: 200000,
    paymentMethod: "credit",
    status: "pending",
    date: "2024-01-02T00:00:00Z",
  },
  {
    id: "txn_3",
    customerId: "cust_123",
    type: "payment",
    amount: 100000, // ₦1,000 payment
    remainingAmount: 0,
    paymentMethod: "cash",
    status: "completed",
    appliedToDebt: true,
    date: "2024-01-03T00:00:00Z",
  },
];

const mockCustomer = {
  id: "cust_123",
  name: "Test Customer",
  outstandingBalance: 600000, // ₦6,000 - stored balance (WRONG!)
  creditBalance: 0,
};

// Simulate the computeRunningBalances logic from useTransactionDetails
function calculateDebtImpact(tx) {
  // Implementation from SimpleTransactionCalculator
  if (tx.type === "sale" || tx.type === "credit") {
    return tx.remainingAmount || 0;
  } else if (tx.type === "payment" && tx.appliedToDebt) {
    return -(tx.amount || 0);
  } else if (tx.type === "refund") {
    return -(tx.amount || 0);
  }
  return 0;
}

function computeBalanceFromTransactions(transactions) {
  // Sort by date ascending
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let running = 0;
  console.log("Transaction-by-transaction calculation:");

  for (const tx of sorted) {
    const impact = calculateDebtImpact(tx);
    running += impact;
    console.log(
      `${tx.date} - ${tx.type} ₦${tx.amount / 100} (impact: ${
        impact / 100
      }) -> Balance: ₦${running / 100}`
    );
  }

  return Math.max(0, running); // Clamp to prevent negative
}

function main() {
  console.log("=== Balance Discrepancy Debug ===\n");

  console.log("Mock Customer Data:");
  console.log(
    `- Stored Balance (customer.outstandingBalance): ₦${
      mockCustomer.outstandingBalance / 100
    }`
  );
  console.log(`- Credit Balance: ₦${mockCustomer.creditBalance / 100}\n`);

  console.log("Mock Transactions:");
  mockTransactions.forEach((tx) => {
    console.log(
      `- ${tx.date}: ${tx.type} ₦${tx.amount / 100} (remaining: ₦${
        (tx.remainingAmount || 0) / 100
      })`
    );
  });
  console.log("");

  const computedBalance = computeBalanceFromTransactions(mockTransactions);

  console.log("\n=== RESULTS ===");
  console.log(`Stored Balance: ₦${mockCustomer.outstandingBalance / 100}`);
  console.log(`Computed Balance: ₦${computedBalance / 100}`);
  console.log(
    `Discrepancy: ₦${(computedBalance - mockCustomer.outstandingBalance) / 100}`
  );

  if (computedBalance !== mockCustomer.outstandingBalance) {
    console.log("\n❌ DISCREPANCY FOUND!");
    console.log("This explains why:");
    console.log(
      "- Transaction Details Screen (uses computed balance): shows ₦6,000"
    );
    console.log(
      "- Customer Details Screen (uses stored balance): shows ₦4,000"
    );
    console.log("\nPossible causes:");
    console.log(
      "1. Payment transactions not updating customer.outstandingBalance"
    );
    console.log(
      "2. Transactions created before balance update logic was implemented"
    );
    console.log("3. Bug in handleDebtManagementInTransaction method");
  } else {
    console.log("\n✅ No discrepancy found in this test data");
  }
}

main();
