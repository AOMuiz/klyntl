# Database Balance Consolidation Proposal

## 🚨 Current Issue: Separate Debt/Credit Tracking

**Problem:** When customer has equal debt and credit amounts, the database maintains both values separately instead of consolidating them to zero.

**Example Scenario:**

- Customer makes ₦2,000 purchase on credit → `outstandingBalance: 2000, credit_balance: 0`
- Customer pays ₦2,000 in advance → `outstandingBalance: 2000, credit_balance: 2000`
- **Result**: Database shows both debt and credit, UI shows "balanced account"
- **User Question**: "Why does the database still have separate values when they cancel out?"

## 🎯 Proposed Solution: Auto-Consolidation Logic

### **Option 1: Real-Time Consolidation**

Every time a payment is processed, automatically consolidate debt and credit:

```typescript
async function consolidateBalance(customerId: string) {
  const customer = await customerRepo.findById(customerId);
  const debt = customer.outstandingBalance || 0;
  const credit = customer.credit_balance || 0;

  if (debt > 0 && credit > 0) {
    const netDebt = Math.max(0, debt - credit);
    const netCredit = Math.max(0, credit - debt);

    // Update to consolidated values
    await db.runAsync(
      `UPDATE customers SET 
       outstandingBalance = ?, 
       credit_balance = ? 
       WHERE id = ?`,
      [netDebt, netCredit, customerId]
    );

    // Log consolidation for audit trail
    await logConsolidation(customerId, debt, credit, netDebt, netCredit);
  }
}
```

### **Option 2: Display-Only Consolidation (Current Approach)**

Keep separate database values but only show net balance in UI:

```typescript
// Database stores: debt=2000, credit=2000
// UI shows: "Account Balanced (₦0)"
const netBalance = debt - credit; // 0
```

### **Option 3: Hybrid Approach**

Consolidate when amounts are exactly equal, preserve separation for partial overlaps:

```typescript
async function smartConsolidation(customerId: string) {
  const customer = await customerRepo.findById(customerId);
  const debt = customer.outstandingBalance || 0;
  const credit = customer.credit_balance || 0;

  // Only consolidate if they exactly cancel out
  if (debt > 0 && credit > 0 && debt === credit) {
    await db.runAsync(
      `UPDATE customers SET 
       outstandingBalance = 0, 
       credit_balance = 0 
       WHERE id = ?`,
      [customerId]
    );

    await logFullConsolidation(customerId, debt);
  }
}
```

## 💰 Business Implications

### **For Nigerian SMEs:**

**Real-Time Consolidation Pros:**

- ✅ Cleaner database state
- ✅ No confusion about "unused credit" when customer has debt
- ✅ Simpler balance calculations
- ✅ Matches user mental model: "If I paid my debt, why do I still show debt in the system?"

**Real-Time Consolidation Cons:**

- ❌ Loses audit trail of original debt/credit amounts
- ❌ Makes it harder to understand payment history
- ❌ Could complicate refund/reversal logic
- ❌ Might not match accounting practices where debt and credit are tracked separately

### **Scenario Analysis:**

**Scenario 1: Customer Prepays then Takes Credit**

1. Customer pays ₦2,000 for future services → `credit_balance: 2000`
2. Customer takes ₦2,000 credit for goods → `outstandingBalance: 2000`

**Current Result:** `outstandingBalance: 2000, credit_balance: 2000`
**Consolidated Result:** `outstandingBalance: 0, credit_balance: 0`

**Business Question:** Which better represents the customer's actual status?

**Scenario 2: Customer Has ₦3K Debt, Pays ₦2K**

1. Customer owes ₦3,000 → `outstandingBalance: 3000`
2. Customer pays ₦2,000 → Reduces debt to ₦1,000

**Current Result:** `outstandingBalance: 1000, credit_balance: 0`
**Consolidated Result:** Same (no consolidation needed)

## 🔧 Implementation Options

### **Option A: Modify Payment Allocation Logic**

Update `PaymentService.handlePaymentAllocation()` to include consolidation:

```typescript
async handlePaymentAllocation(customerId, paymentAmount, appliedToDebt) {
  // ... existing logic ...

  // After payment processing, consolidate if appropriate
  await this.consolidateCustomerBalance(customerId);

  return result;
}

private async consolidateCustomerBalance(customerId: string) {
  // Implement consolidation logic based on business rules
}
```

### **Option B: Scheduled Consolidation**

Run consolidation as a background process:

```typescript
async function dailyBalanceConsolidation() {
  const customersWithBothBalances = await db.getAllAsync(`
    SELECT id FROM customers 
    WHERE outstandingBalance > 0 AND credit_balance > 0
  `);

  for (const customer of customersWithBothBalances) {
    await consolidateBalance(customer.id);
  }
}
```

### **Option C: User-Triggered Consolidation**

Let business owners manually consolidate accounts:

```typescript
// Add "Consolidate Account" button in customer detail screen
async function manualConsolidation(customerId: string) {
  await consolidateBalance(customerId);
  // Show success message: "Account consolidated - debt and credit cleared"
}
```

## 📊 Recommended Approach

**For Nigerian SME Context, I recommend Option 1: Real-Time Consolidation with Enhanced Audit Trail**

**Why:**

1. **User Expectation**: Nigerian business owners expect "paid debt = no debt"
2. **Simplicity**: Eliminates confusion about "available credit vs offsetting credit"
3. **Accounting Match**: Aligns with how small businesses mentally track customer balances
4. **Clean State**: Database reflects actual customer financial position

**Enhanced Implementation:**

```typescript
async function enhancedConsolidation(customerId: string) {
  const customer = await customerRepo.findById(customerId);
  const debt = customer.outstandingBalance || 0;
  const credit = customer.credit_balance || 0;

  if (debt > 0 && credit > 0) {
    const netDebt = Math.max(0, debt - credit);
    const netCredit = Math.max(0, credit - debt);

    // Update balances
    await db.runAsync(
      `UPDATE customers SET 
       outstandingBalance = ?, 
       credit_balance = ? 
       WHERE id = ?`,
      [netDebt, netCredit, customerId]
    );

    // Enhanced audit trail preserves original amounts
    await db.runAsync(
      `
      INSERT INTO balance_consolidations (
        id, customer_id, original_debt, original_credit, 
        net_debt, net_credit, consolidation_date, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        generateId(),
        customerId,
        debt,
        credit,
        netDebt,
        netCredit,
        new Date().toISOString(),
        "Auto-consolidation after payment",
      ]
    );
  }
}
```

## ✅ Next Steps

1. **Create `balance_consolidations` audit table** for tracking consolidation history
2. **Update PaymentService** to include consolidation logic
3. **Add consolidation toggle** in app settings (enable/disable auto-consolidation)
4. **Update UI messaging** to reflect consolidated state
5. **Add manual consolidation feature** for business owners

---

**The core question: Should the database reflect the net financial reality or maintain separate tracking for audit purposes?**

For Nigerian SMEs, **net financial reality** is more important than complex audit trails. Business owners need clarity, not accounting complexity.
