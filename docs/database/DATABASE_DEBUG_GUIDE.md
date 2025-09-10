# Klyntl Database Debugging & Analysis Tools

This directory contains comprehensive tools for debugging database balance discrepancies and analyzing data consistency in the Klyntl Nigerian SME management app.

## 🚨 The Balance Discrepancy Issue

**Problem**: Transaction Details screen shows ₦6,000 owed while Customer Details screen shows ₦4,000.

**Root Cause**: Two different calculation methods:

- Transaction Details: Computes balance from all transactions using `computeRunningBalances()`
- Customer Details: Uses stored `customer.outstandingBalance` from database

## 🛠️ Available Tools

### 1. In-App Debug Tools

#### `src/utils/database-debug.ts`

React Native utilities for exporting and analyzing the app's SQLite database:

- `exportDatabase()` - Copy database to shareable location
- `shareDatabase()` - Share database file via device sharing
- `createDebugSnapshot()` - Generate JSON snapshot with discrepancy data
- `analyzeDatabase()` - Check for balance inconsistencies

#### `src/screens/debug/DatabaseDebugScreen.tsx`

React Native screen component for easy database debugging:

- Export database button
- Share database functionality
- Real-time analysis with results display
- Balance discrepancy detection

**Usage**: Add this screen to your app navigation for easy access during development.

### 2. Local Analysis Scripts

#### `scripts/simple-db-analysis.js`

No-dependency script that generates SQL queries for manual analysis:

```bash
node scripts/simple-db-analysis.js
```

Outputs SQL commands for:

- Balance discrepancy detection
- Database summary statistics
- Customer transaction analysis
- Balance reconciliation fixes

#### `scripts/analyze-db.js` (requires better-sqlite3)

Full-featured Node.js analyzer for exported databases:

```bash
npm install better-sqlite3
node scripts/analyze-db.js exported-db.db --balance-check
node scripts/analyze-db.js exported-db.db --customer cust_123
node scripts/analyze-db.js exported-db.db --reconcile
```

#### `scripts/reconcile-db.js`

Original reconciliation script for checking live database consistency:

```bash
node scripts/reconcile-db.js --dry-run
node scripts/reconcile-db.js --apply
```

### 3. Test Data Generation

#### `debug-balance-discrepancy.js`

Mock data simulation to understand balance calculation differences:

```bash
node debug-balance-discrepancy.js
```

## 📋 Step-by-Step Debug Process

### Phase 1: Export App Database

1. Add `DatabaseDebugScreen` to your app
2. Navigate to the debug screen in your app
3. Tap "Export Database" - saves to app documents directory
4. Tap "Share Database" - share via email/cloud storage
5. Copy the .db file to your computer

### Phase 2: Analyze Locally

```bash
# Quick analysis without dependencies
node scripts/simple-db-analysis.js

# Copy the SQL queries and run with sqlite3
sqlite3 your-exported-db.db "SELECT_QUERY_HERE"

# Or with full analyzer (requires better-sqlite3)
node scripts/analyze-db.js your-exported-db.db --balance-check
```

### Phase 3: Identify Root Cause

Look for customers where:

- `stored_balance` ≠ `computed_balance`
- Computed balance = SUM(sales) - SUM(payments applied to debt)
- Stored balance = `customers.outstandingBalance` field

### Phase 4: Fix Data (if needed)

```bash
# Apply balance reconciliation
node scripts/analyze-db.js your-exported-db.db --reconcile --readonly=false

# Or run the reconcile SQL manually:
sqlite3 your-db.db < reconcile-queries.sql
```

## 🔍 Understanding Balance Calculations

### Transaction Details Screen (computeRunningBalances)

```typescript
// From useTransactionDetails.ts
const calculateDebtImpact = (tx) => {
  if (tx.type === "sale" || tx.type === "credit") {
    return tx.remainingAmount || 0;
  } else if (tx.type === "payment" && tx.appliedToDebt) {
    return -(tx.amount || 0);
  } else if (tx.type === "refund") {
    return -(tx.amount || 0);
  }
  return 0;
};

// Aggregates all transactions for customer
let running = 0;
for (const tx of sortedTransactions) {
  running += calculateDebtImpact(tx);
}
return Math.max(0, running); // Clamps negative values
```

### Customer Details Screen (stored balance)

```typescript
// From useCustomers.ts hook
const customer = await databaseService.customers.findById(id);
return customer.outstandingBalance; // Direct database field
```

## 🧪 Test Scenarios

### Scenario 1: Balance Discrepancy

- Customer stored balance: ₦4,000
- Transaction computation: ₦6,000
- **Cause**: Payment transactions not updating `outstandingBalance`

### Scenario 2: Legacy Data

- Old transactions created before balance update logic
- Stored balances never synchronized with transaction changes
- **Fix**: Run reconciliation to recalculate all balances

### Scenario 3: Failed Transaction Updates

- `handleDebtManagementInTransaction` errors
- Database transaction rollbacks
- **Detection**: Check audit logs for failed updates

## 📊 SQL Queries Reference

### Check Balance Discrepancies

```sql
SELECT
  c.id,
  c.name,
  c.outstandingBalance as stored_balance,
  COALESCE(SUM(CASE
    WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount
    WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN -t.amount
    WHEN t.type = 'refund' THEN -t.amount
    ELSE 0
  END), 0) as computed_balance
FROM customers c
LEFT JOIN transactions t ON c.id = t.customerId AND t.isDeleted = 0
GROUP BY c.id
HAVING stored_balance != computed_balance;
```

### Fix Balance Discrepancies

```sql
UPDATE customers
SET outstandingBalance = (
  SELECT MAX(0, COALESCE(SUM(CASE
    WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount
    WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN -t.amount
    WHEN t.type = 'refund' THEN -t.amount
    ELSE 0
  END), 0))
  FROM transactions t
  WHERE t.customerId = customers.id AND t.isDeleted = 0
);
```

## 🔐 Safety & Best Practices

1. **Always backup** before running reconciliation
2. **Test on exported database** first, not production
3. **Verify fixes** by running balance check after reconciliation
4. **Monitor audit logs** for failed transaction updates
5. **Use transactions** when making bulk updates

## 📁 File Structure

```
klyntl/
├── src/
│   ├── utils/database-debug.ts          # Export & analysis utilities
│   └── screens/debug/DatabaseDebugScreen.tsx  # In-app debug interface
├── scripts/
│   ├── simple-db-analysis.js           # No-dependency analyzer
│   ├── analyze-db.js                   # Full-featured analyzer
│   ├── reconcile-db.js                 # Original reconciliation
│   └── generate-test-db.js             # Test data generator
└── debug-balance-discrepancy.js        # Mock calculation test
```

## 🎯 Next Steps

1. **Immediate**: Use DatabaseDebugScreen to export your current database
2. **Short-term**: Run balance discrepancy analysis to confirm the issue
3. **Medium-term**: Implement automated balance validation in app
4. **Long-term**: Add real-time consistency checks and alerts

---

**Need Help?**

- Run `node scripts/simple-db-analysis.js` for guided SQL queries
- Check `debug-balance-discrepancy.js` for calculation logic examples
- Use DatabaseDebugScreen for easy in-app database export
