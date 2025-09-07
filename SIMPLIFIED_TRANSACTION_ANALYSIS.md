# Simplified Transaction System for Nigerian SMEs

## What You ACTUALLY Need

### Core Business Rules (Keep These)

1. **Sale + Cash/Bank/POS**: Customer pays immediately, no debt
2. **Sale + Credit**: Customer doesn't pay, creates debt
3. **Sale + Mixed**: Partial payment, remaining becomes debt
4. **Payment**: Customer pays existing debt or makes advance payment
5. **Credit/Loan**: Business lends money to customer
6. **Refund**: Return money to customer

### Essential Edge Cases to Handle

1. **First transaction is a payment** (customer paying before any sale)
2. **Overpayment** (customer pays more than they owe)
3. **Payment while having pending debt + new purchase**
4. **Mixed payments on credit sales**

## Minimal Required Components

### 1. Transaction Calculator (Simplified)

```typescript
class SimpleTransactionCalculator {
  static calculateAmounts(type, paymentMethod, amount, paidAmount = 0) {
    switch (type) {
      case "sale":
        if (paymentMethod === "credit") return { paid: 0, remaining: amount };
        if (paymentMethod === "mixed")
          return { paid: paidAmount, remaining: amount - paidAmount };
        return { paid: amount, remaining: 0 }; // cash/bank/pos

      case "payment":
        return { paid: amount, remaining: 0 };

      case "credit":
        return { paid: 0, remaining: amount };

      case "refund":
        return { paid: amount, remaining: 0 };
    }
  }

  static calculateStatus(type, paid, remaining) {
    if (type === "payment" || type === "refund") return "completed";
    if (remaining <= 0) return "completed";
    if (paid > 0) return "partial";
    return "pending";
  }

  static calculateDebtImpact(type, paymentMethod, amount, appliedToDebt) {
    if (
      type === "sale" &&
      (paymentMethod === "credit" || paymentMethod === "mixed")
    ) {
      return amount - (paid || 0); // debt increase
    }
    if (type === "payment" && appliedToDebt) {
      return -amount; // debt decrease
    }
    if (type === "credit") {
      return amount; // debt increase
    }
    if (type === "refund") {
      return -amount; // debt decrease
    }
    return 0;
  }
}
```

### 2. Customer Balance Manager (Simplified)

```typescript
class SimpleCustomerBalance {
  async updateBalance(customerId, debtChange, creditChange = 0) {
    const current = await this.getCurrentBalance(customerId);
    const newDebt = Math.max(0, current.debt + debtChange);
    const newCredit = Math.max(0, current.credit + creditChange);

    await this.db.runAsync(
      `UPDATE customers SET outstandingBalance = ?, creditBalance = ? WHERE id = ?`,
      [newDebt, newCredit, customerId]
    );
  }

  async handlePayment(customerId, paymentAmount, appliedToDebt) {
    if (!appliedToDebt) {
      // Payment for future service - add to credit
      await this.updateBalance(customerId, 0, paymentAmount);
      return { appliedToDebt: 0, creditCreated: paymentAmount };
    }

    const currentDebt = await this.getCurrentDebt(customerId);
    const appliedAmount = Math.min(paymentAmount, currentDebt);
    const excessAmount = paymentAmount - appliedAmount;

    await this.updateBalance(customerId, -appliedAmount, excessAmount);
    return { appliedToDebt: appliedAmount, creditCreated: excessAmount };
  }
}
```

### 3. Simple Audit (Just for Critical Events)

```typescript
class SimpleAudit {
  async logCriticalEvent(customerId, type, amount, description) {
    await this.db.runAsync(
      `INSERT INTO simple_audit (customer_id, event_type, amount, description, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, type, amount, description, new Date().toISOString()]
    );
  }
}
```

## Edge Cases - Simplified Handling

### 1. First Transaction is Payment

```typescript
if (type === "payment" && currentDebt === 0) {
  // No existing debt - treat as advance payment (credit)
  await customerBalance.updateBalance(customerId, 0, amount);
  await audit.logCriticalEvent(
    customerId,
    "advance_payment",
    amount,
    "Payment before any purchase"
  );
}
```

### 2. Overpayment

```typescript
if (type === "payment" && amount > currentDebt) {
  const excess = amount - currentDebt;
  await customerBalance.updateBalance(customerId, -currentDebt, excess);
  await audit.logCriticalEvent(
    customerId,
    "overpayment",
    excess,
    "Excess payment converted to credit"
  );
}
```

### 3. Purchase with Existing Debt

```typescript
if (type === "sale" && currentDebt > 0) {
  // Just add new debt to existing debt - keep it simple
  const newDebt = calculateDebtImpact(type, paymentMethod, amount);
  await customerBalance.updateBalance(customerId, newDebt, 0);
}
```

## What You Can Remove/Simplify

### Remove These (Too Complex for SMEs):

1. `DatabaseTransactionIntegrityService` - Full integrity checking
2. `AuditManagementService` - Comprehensive audit management
3. Complex verification and reconciliation methods
4. Multiple audit types and metadata tracking
5. Status calculation with due dates and overdue logic

### Simplify These:

1. Keep basic `PaymentService` but remove complex allocation algorithms
2. Keep `TransactionCalculationService` but only core methods
3. Remove verification and consistency checking methods
4. Simplify audit to just log critical events

## Recommended Architecture

```
TransactionService (Main Entry Point)
├── SimpleTransactionCalculator (Core calculations)
├── SimpleCustomerBalance (Balance management)
├── SimpleAudit (Critical event logging)
└── TransactionRepository (Database operations)
```

This gives you:

- ✅ Handles all core business scenarios
- ✅ Manages debt and credit properly
- ✅ Handles edge cases without over-engineering
- ✅ Simple enough for Nigerian SMEs to understand
- ✅ Maintainable and debuggable
- ✅ Fast and efficient

## Testing Focus

Instead of complex integrity tests, focus on:

1. Core business scenario tests
2. Edge case handling tests
3. User journey tests (from app flow document)
4. Data consistency tests (simple checks)

Your current system is enterprise-grade but Nigerian SMEs need something simpler, faster, and more intuitive.
