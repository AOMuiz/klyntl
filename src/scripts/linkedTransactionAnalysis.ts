
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
  const stats = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as total_transactions,
      COUNT(linkedTransactionId) as linked_transactions
    FROM transactions 
    WHERE isDeleted = 0
  `);
  
  // Find orphaned links (linkedTransactionId points to non-existent transaction)
  const orphanedLinks = await db.getAllAsync(`
    SELECT t1.id, t1.linkedTransactionId
    FROM transactions t1
    LEFT JOIN transactions t2 ON t1.linkedTransactionId = t2.id
    WHERE t1.linkedTransactionId IS NOT NULL 
      AND t1.isDeleted = 0
      AND (t2.id IS NULL OR t2.isDeleted = 1)
  `);
  
  // Find payments that should be linked but aren't
  const unllinkedPayments = await db.getAllAsync(`
    SELECT id, customerId, amount, date
    FROM transactions
    WHERE type = 'payment' 
      AND linkedTransactionId IS NULL 
      AND isDeleted = 0
  `);
  
  const recommendations = [];
  
  if (stats.linked_transactions === 0) {
    recommendations.push('linkedTransactionId is not being used - consider implementing payment-to-sale linking');
  } else {
    recommendations.push(`${stats.linked_transactions} transactions use linkedTransactionId`);
  }
  
  if (orphanedLinks.length > 0) {
    recommendations.push(`${orphanedLinks.length} transactions have orphaned linkedTransactionId references`);
  }
  
  if (unllinkedPayments.length > 0) {
    recommendations.push(`${unllinkedPayments.length} payments are not linked to any sale`);
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
    const result = await db.runAsync(`
      UPDATE transactions 
      SET linkedTransactionId = NULL
      WHERE linkedTransactionId IS NOT NULL 
        AND linkedTransactionId NOT IN (
          SELECT id FROM transactions WHERE isDeleted = 0
        )
        AND isDeleted = 0
    `);
    
    console.log(`Cleared ${result.changes} orphaned linkedTransactionId references`);
    return result.changes;
  });
}

export { analyzeLinkedTransactions, fixOrphanedLinkedTransactions };
