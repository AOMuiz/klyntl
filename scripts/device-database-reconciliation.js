#!/usr/bin/env node

/**
 * On-Device Database Balance Reconciliation Script
 *
 * This script will apply the same balance fixes we made to the exported database
 * directly to the on-device app database through the DatabaseService
 */

const fs = require("fs");
const Database = require("better-sqlite3");

function formatCurrency(amount) {
  return `₦${(amount / 100).toLocaleString()}`;
}

function analyzeLinkedTransactions(db) {
  console.log("=== Linked Transaction Analysis ===");

  const linkedStats = db
    .prepare(
      `
    SELECT 
      COUNT(*) as total_transactions,
      COUNT(linkedTransactionId) as linked_transactions,
      COUNT(DISTINCT linkedTransactionId) as unique_linked_ids
    FROM transactions 
    WHERE isDeleted = 0
  `
    )
    .get();

  console.log(`Total Transactions: ${linkedStats.total_transactions}`);
  console.log(
    `Transactions with linkedTransactionId: ${linkedStats.linked_transactions}`
  );
  console.log(
    `Unique linkedTransactionId values: ${linkedStats.unique_linked_ids}`
  );

  // Find transactions with linkedTransactionId
  const linkedTransactions = db
    .prepare(
      `
    SELECT id, type, amount, linkedTransactionId, customerId, date 
    FROM transactions 
    WHERE linkedTransactionId IS NOT NULL AND isDeleted = 0
    ORDER BY date DESC
  `
    )
    .all();

  if (linkedTransactions.length > 0) {
    console.log(`\nLinked Transactions Found (${linkedTransactions.length}):`);
    console.table(
      linkedTransactions.map((tx) => ({
        ID: tx.id.substring(0, 12) + "...",
        Type: tx.type,
        Amount: formatCurrency(tx.amount),
        "Linked To": tx.linkedTransactionId.substring(0, 12) + "...",
        Date: tx.date.substring(0, 10),
      }))
    );

    // Check if linked transactions actually exist
    console.log("\nLinked Transaction Integrity Check:");
    for (const tx of linkedTransactions) {
      const linkedExists = db
        .prepare(
          `
        SELECT id, type FROM transactions 
        WHERE id = ? AND isDeleted = 0
      `
        )
        .get(tx.linkedTransactionId);

      if (!linkedExists) {
        console.log(
          `❌ Transaction ${tx.id.substring(
            0,
            12
          )}... links to non-existent ${tx.linkedTransactionId.substring(
            0,
            12
          )}...`
        );
      } else {
        console.log(
          `✅ Transaction ${tx.id.substring(0, 12)}... (${
            tx.type
          }) properly linked to ${tx.linkedTransactionId.substring(
            0,
            12
          )}... (${linkedExists.type})`
        );
      }
    }
  } else {
    console.log("No transactions are using linkedTransactionId");
  }

  // Analyze transaction types that should potentially be linked
  const paymentStats = db
    .prepare(
      `
    SELECT 
      type,
      COUNT(*) as count,
      COUNT(linkedTransactionId) as linked_count
    FROM transactions 
    WHERE isDeleted = 0
    GROUP BY type
  `
    )
    .all();

  console.log("\nTransaction Types vs Linking Usage:");
  console.table(
    paymentStats.map((stat) => ({
      Type: stat.type,
      "Total Count": stat.count,
      "Linked Count": stat.linked_count,
      "Link Percentage":
        stat.count > 0
          ? `${((stat.linked_count / stat.count) * 100).toFixed(1)}%`
          : "0%",
    }))
  );

  return {
    totalTransactions: linkedStats.total_transactions,
    linkedTransactions: linkedStats.linked_transactions,
    uniqueLinkedIds: linkedStats.unique_linked_ids,
    isUsed: linkedStats.linked_transactions > 0,
  };
}

function createDeviceBalanceScript() {
  const scriptContent = `
/**
 * Device Database Balance Reconciliation Script
 * 
 * Run this in your React Native app to fix balance discrepancies
 */

import { databaseService } from '@/services/database';

async function reconcileDeviceBalances() {
  console.log('Starting device database balance reconciliation...');
  
  try {
    // Get database instance
    const db = databaseService.db;
    
    // Get all customers with transactions
    const customers = await db.getAllAsync(
      'SELECT id, name, outstandingBalance, credit_balance FROM customers'
    );
    
    const corrections = [];
    
    for (const customer of customers) {
      // Get transactions for this customer
      const transactions = await db.getAllAsync(
        \`SELECT * FROM transactions 
         WHERE customerId = ? AND isDeleted = 0 
         ORDER BY date ASC\`,
        [customer.id]
      );
      
      if (transactions.length === 0) continue;
      
      let correctOutstanding = 0;
      let correctCredit = 0;
      
      // Calculate correct balances using the same logic as our export fix
      for (const tx of transactions) {
        if (tx.type === 'sale' || tx.type === 'credit') {
          correctOutstanding += (tx.remainingAmount || tx.amount);
        } else if (tx.type === 'payment') {
          if (tx.appliedToDebt === 1) {
            correctOutstanding -= tx.amount;
          } else {
            correctCredit += tx.amount;
          }
        } else if (tx.type === 'refund') {
          correctOutstanding -= tx.amount;
        }
      }
      
      correctOutstanding = Math.max(0, correctOutstanding);
      
      // Check if correction is needed
      if (customer.outstandingBalance !== correctOutstanding || 
          customer.credit_balance !== correctCredit) {
        corrections.push({
          customerId: customer.id,
          name: customer.name,
          currentOutstanding: customer.outstandingBalance,
          correctOutstanding: correctOutstanding,
          currentCredit: customer.credit_balance,
          correctCredit: correctCredit
        });
      }
    }
    
    console.log(\`Found \${corrections.length} customers needing balance corrections\`);
    
    if (corrections.length === 0) {
      console.log('✅ No balance corrections needed!');
      return { success: true, corrections: [] };
    }
    
    // Apply corrections in a transaction
    return await db.withTransactionAsync(async () => {
      const now = new Date().toISOString();
      
      for (const correction of corrections) {
        await db.runAsync(
          \`UPDATE customers 
           SET outstandingBalance = ?, credit_balance = ?, updatedAt = ?
           WHERE id = ?\`,
          [
            correction.correctOutstanding,
            correction.correctCredit,
            now,
            correction.customerId
          ]
        );
        
        console.log(\`✅ Fixed \${correction.name}: Outstanding \${correction.currentOutstanding/100} → \${correction.correctOutstanding/100}, Credit \${correction.currentCredit/100} → \${correction.correctCredit/100}\`);
      }
      
      return { success: true, corrections };
    });
    
  } catch (error) {
    console.error('Error during balance reconciliation:', error);
    return { success: false, error: error.message };
  }
}

// Export for use in your app
export { reconcileDeviceBalances };

// Example usage:
/*
import { reconcileDeviceBalances } from './scripts/deviceBalanceReconciliation';

// Call this in your app when needed
const result = await reconcileDeviceBalances();
if (result.success) {
  console.log(\`Successfully fixed \${result.corrections.length} customer balances\`);
} else {
  console.error('Failed to fix balances:', result.error);
}
*/
`;

  fs.writeFileSync(
    "/Users/localadmin/Desktop/projects/klyntl/src/scripts/deviceBalanceReconciliation.ts",
    scriptContent
  );
  console.log(
    "📄 Created device balance reconciliation script: src/scripts/deviceBalanceReconciliation.ts"
  );
}

function createLinkedTransactionFixScript() {
  const scriptContent = `
/**
 * Linked Transaction Analysis and Fix Script
 * 
 * Analyzes and fixes linkedTransactionId usage in the app
 */

import { databaseService } from '@/services/database';

interface LinkedTransactionAnalysis {
  totalTransactions: number;
  linkedTransactions: number;
  orphanedLinks: number;
  missingLinks: number;
  recommendations: string[];
}

async function analyzeLinkedTransactions(): Promise<LinkedTransactionAnalysis> {
  const db = databaseService.db;
  
  // Get basic stats
  const stats = await db.getFirstAsync(\`
    SELECT 
      COUNT(*) as total_transactions,
      COUNT(linkedTransactionId) as linked_transactions
    FROM transactions 
    WHERE isDeleted = 0
  \`);
  
  // Find orphaned links (linkedTransactionId points to non-existent transaction)
  const orphanedLinks = await db.getAllAsync(\`
    SELECT t1.id, t1.linkedTransactionId
    FROM transactions t1
    LEFT JOIN transactions t2 ON t1.linkedTransactionId = t2.id
    WHERE t1.linkedTransactionId IS NOT NULL 
      AND t1.isDeleted = 0
      AND (t2.id IS NULL OR t2.isDeleted = 1)
  \`);
  
  // Find payments that should be linked but aren't
  const unllinkedPayments = await db.getAllAsync(\`
    SELECT id, customerId, amount, date
    FROM transactions
    WHERE type = 'payment' 
      AND linkedTransactionId IS NULL 
      AND isDeleted = 0
  \`);
  
  const recommendations = [];
  
  if (stats.linked_transactions === 0) {
    recommendations.push('linkedTransactionId is not being used - consider implementing payment-to-sale linking');
  } else {
    recommendations.push(\`\${stats.linked_transactions} transactions use linkedTransactionId\`);
  }
  
  if (orphanedLinks.length > 0) {
    recommendations.push(\`\${orphanedLinks.length} transactions have orphaned linkedTransactionId references\`);
  }
  
  if (unllinkedPayments.length > 0) {
    recommendations.push(\`\${unllinkedPayments.length} payments are not linked to any sale\`);
  }
  
  return {
    totalTransactions: stats.total_transactions,
    linkedTransactions: stats.linked_transactions,
    orphanedLinks: orphanedLinks.length,
    missingLinks: unllinkedPayments.length,
    recommendations
  };
}

async function fixOrphanedLinkedTransactions() {
  const db = databaseService.db;
  
  return await db.withTransactionAsync(async () => {
    // Clear orphaned linkedTransactionId references
    const result = await db.runAsync(\`
      UPDATE transactions 
      SET linkedTransactionId = NULL
      WHERE linkedTransactionId IS NOT NULL 
        AND linkedTransactionId NOT IN (
          SELECT id FROM transactions WHERE isDeleted = 0
        )
        AND isDeleted = 0
    \`);
    
    console.log(\`Cleared \${result.changes} orphaned linkedTransactionId references\`);
    return result.changes;
  });
}

export { analyzeLinkedTransactions, fixOrphanedLinkedTransactions };
`;

  fs.writeFileSync(
    "/Users/localadmin/Desktop/projects/klyntl/src/scripts/linkedTransactionAnalysis.ts",
    scriptContent
  );
  console.log(
    "📄 Created linked transaction analysis script: src/scripts/linkedTransactionAnalysis.ts"
  );
}

function main() {
  const dbFile = "assets/klyntl-export-1757424500055.db";

  console.log("=== On-Device Database Analysis & Fix Generation ===\n");

  const db = new Database(dbFile, { readonly: true });

  try {
    // 1. Analyze linked transactions in the exported database
    const linkedAnalysis = analyzeLinkedTransactions(db);

    // 2. Generate device-specific balance reconciliation script
    createDeviceBalanceScript();

    // 3. Generate linked transaction analysis script
    createLinkedTransactionFixScript();

    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY & NEXT STEPS");
    console.log("=".repeat(60));

    console.log("\n📋 FINDINGS:");
    console.log(
      `• linkedTransactionId is ${
        linkedAnalysis.isUsed ? "USED" : "NOT USED"
      } in your database`
    );
    console.log(`• ${linkedAnalysis.totalTransactions} total transactions`);
    console.log(
      `• ${linkedAnalysis.linkedTransactions} transactions have linkedTransactionId set`
    );

    console.log("\n📄 GENERATED FILES:");
    console.log(
      "• src/scripts/deviceBalanceReconciliation.ts - Fix balances on device"
    );
    console.log(
      "• src/scripts/linkedTransactionAnalysis.ts - Analyze/fix linked transactions"
    );

    console.log("\n🚀 TO APPLY FIXES ON DEVICE:");
    console.log("1. Import the deviceBalanceReconciliation script in your app");
    console.log("2. Call reconcileDeviceBalances() function");
    console.log("3. Use linkedTransactionAnalysis to check linking issues");

    if (!linkedAnalysis.isUsed) {
      console.log("\n💡 LINKEDTRANSACTIONID RECOMMENDATION:");
      console.log("• linkedTransactionId is not currently being used");
      console.log(
        "• This field is designed to link payments to specific sales/credits"
      );
      console.log(
        "• Consider implementing this for better transaction traceability"
      );
      console.log("• Current payment system uses appliedToDebt flag instead");
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main();
}
