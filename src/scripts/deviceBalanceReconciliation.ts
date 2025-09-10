
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
        `SELECT * FROM transactions 
         WHERE customerId = ? AND isDeleted = 0 
         ORDER BY date ASC`,
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
    
    console.log(`Found ${corrections.length} customers needing balance corrections`);
    
    if (corrections.length === 0) {
      console.log('✅ No balance corrections needed!');
      return { success: true, corrections: [] };
    }
    
    // Apply corrections in a transaction
    return await db.withTransactionAsync(async () => {
      const now = new Date().toISOString();
      
      for (const correction of corrections) {
        await db.runAsync(
          `UPDATE customers 
           SET outstandingBalance = ?, credit_balance = ?, updatedAt = ?
           WHERE id = ?`,
          [
            correction.correctOutstanding,
            correction.correctCredit,
            now,
            correction.customerId
          ]
        );
        
        console.log(`✅ Fixed ${correction.name}: Outstanding ${correction.currentOutstanding/100} → ${correction.correctOutstanding/100}, Credit ${correction.currentCredit/100} → ${correction.correctCredit/100}`);
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
  console.log(`Successfully fixed ${result.corrections.length} customer balances`);
} else {
  console.error('Failed to fix balances:', result.error);
}
*/
