# Klyntl Database Debugging & Analysis Tools

This directory contains comprehensive tools for debugging, analyzing, and maintaining the Klyntl database. These tools help identify data inconsistencies, export data for analysis, and fix balance discrepancies.

## 🛠️ Available Tools

### 1. In-App Database Debug Screen (`src/screens/debug/DatabaseDebugScreen.tsx`)

A React Native screen component that provides database debugging capabilities directly in the app.

**Features:**

- Export database to shareable file
- Create debug snapshots with customer and transaction data
- Analyze database consistency and identify issues
- Real-time balance discrepancy detection

**Usage:**

```typescript
import DatabaseDebugScreen from "@/screens/debug/DatabaseDebugScreen";

// Add to your navigation stack
<Stack.Screen name="DatabaseDebug" component={DatabaseDebugScreen} />;
```

### 2. Database Debug Utilities (`src/utils/database-debug.ts`)

React Native utilities for database operations.

**Key Functions:**

- `exportDatabase()` - Export app database to file
- `shareDatabase()` - Share database via system sharing
- `createDebugSnapshot()` - Generate detailed debug report
- `analyzeDatabase()` - Check for consistency issues

### 3. Simple Database Analysis (`scripts/simple-db-analysis.js`)

Node.js script that generates SQL queries for database analysis (no external dependencies).

**Usage:**

```bash
node scripts/simple-db-analysis.js
```

This generates SQL queries that you can run with sqlite3:

```bash
sqlite3 your-database.db "SELECT * FROM customers WHERE outstandingBalance != computed_balance;"
```

### 4. Advanced Database Analysis (`scripts/analyze-db.js`)

Full-featured Node.js analysis tool (requires better-sqlite3).

**Installation:**

```bash
npm install --save-dev better-sqlite3
```

**Usage:**

```bash
# Check for balance discrepancies
node scripts/analyze-db.js your-database.db --balance-check

# Analyze specific customer
node scripts/analyze-db.js your-database.db --customer cust_001

# Export data to CSV
node scripts/analyze-db.js your-database.db --export-csv

# Fix balance discrepancies (modifies database)
node scripts/analyze-db.js your-database.db --reconcile
```

### 5. Balance Discrepancy Debug (`debug-balance-discrepancy.js`)

Standalone script to debug the specific balance discrepancy issue.

**Usage:**

```bash
node debug-balance-discrepancy.js
```

## 🔍 Identifying Balance Discrepancies

The main issue we've been investigating is why transaction details show different balances than customer details. Here's how to diagnose it:

### Step 1: Export Database from App

1. Add the DatabaseDebugScreen to your app
2. Navigate to the debug screen
3. Tap "Export Database"
4. Copy the exported `.db` file to your computer

### Step 2: Run Balance Check

```bash
# Using simple analysis (recommended)
node scripts/simple-db-analysis.js > analysis.sql
sqlite3 your-exported-db.db < analysis.sql

# Or using advanced analysis (if better-sqlite3 is installed)
node scripts/analyze-db.js your-exported-db.db --balance-check
```

### Step 3: Analyze Results

The analysis will show:

- **Stored Balance**: Value in `customers.outstandingBalance`
- **Computed Balance**: Calculated from transaction history
- **Difference**: How much they differ

## 🐛 Common Issues & Solutions

### Issue: Balance Discrepancies

**Symptoms:**

- Transaction details show ₦6,000 owed
- Customer details show ₦4,000 owed
- Inconsistent data display

**Root Causes:**

1. Payment transactions not updating customer balance
2. Transactions created before balance update logic
3. Bug in `handleDebtManagementInTransaction` method

**Solution:**

```bash
# Generate reconciliation SQL
node scripts/simple-db-analysis.js

# Run the reconciliation queries (backup first!)
sqlite3 your-database.db < reconciliation.sql
```

### Issue: Orphaned Transactions

**Symptoms:**

- Transactions exist without corresponding customers

**Solution:**

```sql
-- Find orphaned transactions
SELECT t.* FROM transactions t
LEFT JOIN customers c ON t.customerId = c.id
WHERE c.id IS NULL;

-- Delete orphaned transactions
DELETE FROM transactions WHERE customerId NOT IN (SELECT id FROM customers);
```

### Issue: Invalid Transaction Statuses

**Symptoms:**

- Transactions with `remainingAmount = 0` but `status != 'completed'`

**Solution:**

```sql
-- Fix transaction statuses
UPDATE transactions SET status = CASE
  WHEN COALESCE(remainingAmount,0) = 0 THEN 'completed'
  WHEN COALESCE(remainingAmount,0) > 0 AND COALESCE(remainingAmount,0) < amount THEN 'partial'
  WHEN COALESCE(remainingAmount,0) >= amount THEN 'pending'
  ELSE status
END WHERE isDeleted = 0;
```

## 📊 Database Schema

### Customers Table

```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  totalSpent INTEGER DEFAULT 0,
  outstandingBalance INTEGER DEFAULT 0,  -- Stored balance (kobo)
  creditBalance INTEGER DEFAULT 0,       -- Available credit (kobo)
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### Transactions Table

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL,
  amount INTEGER NOT NULL,               -- Transaction amount (kobo)
  remainingAmount INTEGER DEFAULT 0,     -- Outstanding amount (kobo)
  type TEXT NOT NULL,                    -- 'sale', 'payment', 'credit', 'refund'
  paymentMethod TEXT,                    -- 'cash', 'credit', 'mixed', etc.
  appliedToDebt INTEGER DEFAULT 0,       -- Whether payment applied to debt
  date TEXT NOT NULL,
  isDeleted INTEGER DEFAULT 0
);
```

## 🔧 Balance Calculation Logic

### Stored Balance

- Value in `customers.outstandingBalance`
- Updated by `CustomerRepository.increaseOutstandingBalance()` / `decreaseOutstandingBalance()`
- Should be updated whenever transactions are created/modified

### Computed Balance

- Calculated from transaction history
- Formula: `SUM(sales + credits) - SUM(payments_to_debt + refunds)`
- Used by `useTransactionDetails.computeRunningBalances()`

### Synchronization

The stored balance should always equal the computed balance. If they differ:

1. **Check transaction creation logic** in `TransactionRepository.create()`
2. **Verify payment allocation** in `SimplePaymentService.handlePaymentAllocationInTransaction()`
3. **Review update operations** in `TransactionRepository.update()`

## 🚀 Quick Start

1. **Add debug screen to your app:**

```typescript
// In your navigation setup
import DatabaseDebugScreen from "@/screens/debug/DatabaseDebugScreen";

<Stack.Screen name="DatabaseDebug" component={DatabaseDebugScreen} />;
```

2. **Export and analyze database:**

```bash
# Export from app, then analyze
node scripts/simple-db-analysis.js > analysis.sql
sqlite3 exported-db.db < analysis.sql
```

3. **Fix discrepancies:**

```bash
# Generate reconciliation queries
node scripts/simple-db-analysis.js

# Apply fixes (backup first!)
sqlite3 your-database.db < reconciliation.sql
```

## 📝 Testing

Create test databases to verify the analysis tools:

```bash
# Generate test data
node scripts/generate-test-db.js

# Create SQLite database
sqlite3 test-klyntl.db < test-database.sql

# Run analysis
node scripts/analyze-db.js test-klyntl.db --balance-check
```

## 🔒 Security Notes

- **Always backup** your database before running reconciliation
- **Test fixes** on a copy of your database first
- **Verify results** after applying changes
- **Document changes** for audit trail

## 📞 Support

If you encounter issues:

1. Check the analysis output for specific error details
2. Verify your database schema matches the expected structure
3. Test with the provided test database first
4. Review the transaction creation/update logic in your codebase

## 📋 Checklist for Balance Issues

- [ ] Export database from app
- [ ] Run balance discrepancy check
- [ ] Identify root cause (missing updates, wrong calculations, etc.)
- [ ] Create backup of database
- [ ] Apply reconciliation fixes
- [ ] Verify balances are now consistent
- [ ] Test transaction creation/update flows
- [ ] Monitor for future discrepancies
