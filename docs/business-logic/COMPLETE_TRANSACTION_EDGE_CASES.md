# Complete Transaction Calculation Edge Cases

## Overview

This document covers ALL possible calculation edge cases for the KLYNTL transaction system, based on the Nigerian SME business flow and current codebase analysis.

---

## **TRANSACTION TYPE EDGE CASES**

### **1. SALE TRANSACTIONS**

#### 1.1 Cash Sale Edge Cases

- **Scenario**: Customer pays exact amount in cash
- **Calculation**: `paidAmount = amount`, `remainingAmount = 0`, `status = "completed"`
- **Edge Case**: Zero amount sale → Should reject or handle specially

#### 1.2 Credit Sale Edge Cases

- **Scenario**: Customer buys on credit (no immediate payment)
- **Calculation**: `paidAmount = 0`, `remainingAmount = amount`, `status = "pending"`
- **Edge Cases**:
  - Customer already has maximum credit limit → Reject or require approval
  - Sale amount exceeds available credit → Partial approval needed

#### 1.3 Mixed Payment Edge Cases

- **Scenario**: Customer pays part cash, part credit
- **Calculation**: `paidAmount = cashPortion`, `remainingAmount = amount - cashPortion`
- **Edge Cases**:
  - `cashPortion > amount` → Invalid, reject transaction
  - `cashPortion = 0` → Effectively a credit sale
  - `cashPortion = amount` → Effectively a cash sale
  - `cashPortion < 0` → Invalid, reject transaction
  - Floating point precision issues with currency calculations

### **2. PAYMENT TRANSACTIONS**

#### 2.1 Payment Applied to Debt

- **Normal**: Customer has debt, pays some/all of it
- **Edge Cases**:
  - **First transaction is payment** (customer has no prior debt)
    - Action: Create credit balance or reject
  - **Overpayment** (payment > existing debt)
    - Action: Clear debt, create credit balance for excess
  - **Exact payment** (payment = existing debt)
    - Action: Clear debt completely
  - **Underpayment** (payment < existing debt)
    - Action: Reduce debt by payment amount

#### 2.2 Payment NOT Applied to Debt (Future Service)

- **Scenario**: Customer pays for future services
- **Calculation**: Create credit balance, don't affect existing debt
- **Edge Cases**:
  - Customer has existing debt but chooses not to apply payment to it
  - Large advance payments exceeding typical transaction amounts

#### 2.3 Payment Allocation Edge Cases

- **Multiple Outstanding Debts**:
  - FIFO allocation (oldest first) vs LIFO (newest first)
  - High-priority debts vs regular debts
  - Different interest rates or due dates
- **Partial Allocation**:
  - Payment insufficient to clear any complete debt
  - Payment exactly clears multiple smaller debts

### **3. CREDIT TRANSACTIONS (Loans)**

#### 3.1 Direct Credit Extension

- **Scenario**: Business lends money to customer
- **Calculation**: `paidAmount = 0`, `remainingAmount = amount`, increases debt
- **Edge Cases**:
  - Credit limit enforcement
  - Interest calculation and compounding
  - Loan terms and repayment schedules

### **4. REFUND TRANSACTIONS**

#### 4.1 Cash Refund

- **Scenario**: Return money to customer
- **Calculation**: Reduces customer debt or creates credit balance
- **Edge Cases**:
  - **Refund > customer debt**: Creates credit balance
  - **Refund when customer has credit balance**: Increases credit
  - **Refund for disputed vs accepted returns**

---

## **CUSTOMER BALANCE EDGE CASES**

### **1. DEBT CALCULATION EDGE CASES**

#### 1.1 Zero Balance Scenarios

- New customer (no transactions)
- Customer with fully paid debts
- Customer with credit balance (negative debt)

#### 1.2 Credit Balance Scenarios

- **Credit from overpayments**
- **Credit from refunds**
- **Credit from promotional credits**
- **Using credit balance for new purchases**

#### 1.3 Balance Transition Edge Cases

- **Debt → Zero Balance**: Last payment exactly clears debt
- **Debt → Credit Balance**: Overpayment scenario
- **Credit Balance → Zero**: Credit exactly used up
- **Credit Balance → Debt**: Purchase exceeds available credit

### **2. BALANCE CALCULATION PRECISION**

#### 2.1 Currency Precision Issues

- **Kobo precision**: All amounts in kobo to avoid floating point errors
- **Rounding errors**: Sum of transactions vs stored balance
- **Display vs storage**: Converting kobo to naira for display

#### 2.2 Audit Trail Consistency

- **Calculated balance** (from transaction history) vs **stored balance**
- **Missing transactions** causing discrepancies
- **Incorrect transaction amounts** affecting balance

---

## **PAYMENT METHOD EDGE CASES**

### **1. MIXED PAYMENT COMBINATIONS**

#### 1.1 Cash + Credit Combinations

- **Scenario**: ₦10,000 sale → ₦3,000 cash + ₦7,000 credit
- **Edge Cases**:
  - Cash portion = 0 (effectively credit sale)
  - Credit portion = 0 (effectively cash sale)
  - Invalid splits (sum ≠ total)

#### 1.2 Cash + Existing Credit Balance

- **Scenario**: Customer has ₦2,000 credit, makes ₦5,000 purchase
- **Options**:
  - Use all credit + ₦3,000 cash
  - Use partial credit + more cash
  - Don't use credit at all

#### 1.3 Multiple Payment Methods

- **Complex scenarios**: Cash + Bank Transfer + Credit + Existing Credit Balance
- **Validation**: All portions must sum to total amount

### **2. PAYMENT TIMING EDGE CASES**

#### 2.1 Backdated Transactions

- **Scenario**: Recording old transactions
- **Impact**: May affect historical balance calculations and reports

#### 2.2 Future-dated Transactions

- **Scenario**: Scheduled payments or sales
- **Impact**: Should these affect current balance calculations?

---

## **STATUS CALCULATION EDGE CASES**

### **1. STATUS TRANSITIONS**

#### 1.1 Simple Status Rules

```typescript
// Basic status calculation
if (type === "payment" || type === "refund") return "completed";
if (remainingAmount <= 0) return "completed";
if (paidAmount > 0 && remainingAmount > 0) return "partial";
if (paidAmount === 0 && remainingAmount > 0) return "pending";
```

#### 1.2 Complex Status Scenarios

- **Disputed transactions**: Status = "disputed"
- **Overdue transactions**: Status = "overdue" (based on due date)
- **Cancelled transactions**: Status = "cancelled"
- **Reversed transactions**: Status after reversal

### **2. DUE DATE CALCULATIONS**

#### 2.1 Due Date Edge Cases

- **No due date specified**: How to handle aging?
- **Past due date**: Automatic status change to "overdue"
- **Grace period**: Due date + grace period before overdue
- **Weekends/holidays**: Business day calculations

---

## **CURRENCY AND PRECISION EDGE CASES**

### **1. KOBO PRECISION**

#### 1.1 Conversion Edge Cases

- **Input**: User enters ₦10.50 → Store as 1050 kobo
- **Calculation**: All math in kobo to avoid floating point errors
- **Display**: Convert back to naira for user interface
- **Edge Case**: Half-kobo amounts (should round or reject?)

#### 1.2 Large Amount Handling

- **Maximum values**: JavaScript number precision limits
- **Overflow protection**: Validate maximum transaction amounts
- **Scientific notation**: Very large numbers display issues

### **2. MULTI-CURRENCY SCENARIOS**

#### 2.1 USD Payments (Future)

- **Exchange rate fluctuations**
- **Rate at transaction time** vs **current rate**
- **Debt in NGN, payment in USD**

---

## **SEQUENTIAL TRANSACTION EDGE CASES**

### **1. TRANSACTION ORDER DEPENDENCIES**

#### 1.1 Order-Sensitive Scenarios

```typescript
// Example: Customer starts with ₦0 balance
1. Payment ₦5,000 (not applied to debt) → Credit balance: ₦5,000
2. Sale ₦8,000 on credit → Uses ₦5,000 credit + ₦3,000 debt
3. Payment ₦2,000 (applied to debt) → Debt: ₦1,000
4. Refund ₦1,500 → Credit balance: ₦500
```

#### 1.2 Concurrent Transaction Handling

- **Race conditions**: Multiple transactions at same time
- **Database locking**: Ensure balance consistency
- **Transaction rollback**: What happens if one transaction fails?

---

## **VALIDATION EDGE CASES**

### **1. INPUT VALIDATION**

#### 1.1 Amount Validation

- **Negative amounts**: Should be rejected
- **Zero amounts**: Special handling needed
- **Invalid formats**: Non-numeric input
- **Precision limits**: Too many decimal places

#### 1.2 Business Rule Validation

- **Credit limits**: Enforce maximum debt per customer
- **Payment limits**: Maximum payment amounts
- **Transaction frequency**: Rate limiting for fraud prevention

### **2. DATA CONSISTENCY VALIDATION**

#### 2.1 Balance Verification

```typescript
// Verify stored balance matches calculated balance
const calculatedBalance = sumAllTransactionImpacts(customerId);
const storedBalance = customer.outstandingBalance;
if (Math.abs(calculatedBalance - storedBalance) > 0.01) {
  // Discrepancy detected - needs resolution
}
```

#### 2.2 Transaction Integrity

- **Missing transactions**: Gaps in transaction sequence
- **Duplicate transactions**: Same transaction recorded twice
- **Orphaned transactions**: References to non-existent customers

---

## **ERROR HANDLING EDGE CASES**

### **1. RECOVERY SCENARIOS**

#### 1.1 Data Corruption Recovery

- **Inconsistent balances**: How to recalculate from transaction history
- **Missing audit records**: How to reconstruct payment history
- **Incomplete transactions**: How to handle partially saved transactions

#### 1.2 System Failure Scenarios

- **Network failure during transaction**: Is transaction committed or not?
- **App crash during calculation**: How to resume or rollback?
- **Database corruption**: How to restore data integrity?

---

## **BUSINESS LOGIC EDGE CASES**

### **1. NIGERIAN SME SPECIFIC**

#### 1.1 Cash Flow Scenarios

- **Seasonal businesses**: Long periods without transactions
- **Cash-heavy businesses**: Mostly cash transactions with occasional credit
- **Credit-heavy businesses**: Most sales on credit, payments irregular

#### 1.2 Customer Relationship Edge Cases

- **Family/friend customers**: Different credit terms
- **VIP customers**: Higher credit limits, special treatment
- **Problem customers**: Credit restrictions, payment enforcement

### **2. REPORTING EDGE CASES**

#### 2.1 Financial Reports

- **Period-end calculations**: Month/year-end balance calculations
- **Aging reports**: Categorizing debt by age
- **Cash flow reports**: Distinguishing between sales and collections

---

## **TESTING PRIORITY MATRIX**

### **HIGH PRIORITY (Must Test)**

1. ✅ Overpayment handling (payment > debt)
2. ✅ First transaction is payment (no existing debt)
3. ✅ Mixed payment validation (amounts sum correctly)
4. ✅ Credit balance usage for purchases
5. ✅ Balance calculation precision (kobo handling)
6. ✅ Status transitions (pending → partial → completed)

### **MEDIUM PRIORITY (Should Test)**

1. ⚠️ Multiple debt allocation strategies
2. ⚠️ Refund impact on balances
3. ⚠️ Backdated transaction handling
4. ⚠️ Large amount handling
5. ⚠️ Concurrent transaction processing

### **LOW PRIORITY (Nice to Test)**

1. 📋 Multi-currency scenarios
2. 📋 System failure recovery
3. 📋 Data corruption handling
4. 📋 Advanced aging calculations

---

## **IMPLEMENTATION RECOMMENDATIONS**

### **1. Essential Edge Case Handling**

```typescript
class SimplifiedTransactionCalculator {
  // Handle the top 6 high-priority edge cases
  static handlePayment(customerId, amount, applyToDebt) {
    if (applyToDebt) {
      return handlePaymentToDebt(customerId, amount);
    } else {
      return handlePaymentForFuture(customerId, amount);
    }
  }

  static handlePaymentToDebt(customerId, amount) {
    const currentDebt = getCurrentDebt(customerId);

    if (currentDebt === 0) {
      // Edge case: First transaction is payment
      return createCreditBalance(customerId, amount);
    }

    if (amount > currentDebt) {
      // Edge case: Overpayment
      const excess = amount - currentDebt;
      clearDebt(customerId);
      return createCreditBalance(customerId, excess);
    }

    // Normal payment
    return reduceDebt(customerId, amount);
  }

  static validateMixedPayment(totalAmount, cashAmount, creditAmount) {
    // Edge case: Amounts must sum correctly
    if (Math.abs(cashAmount + creditAmount - totalAmount) > 0.01) {
      throw new ValidationError("Payment amounts must equal total");
    }

    if (cashAmount < 0 || creditAmount < 0) {
      throw new ValidationError("Payment amounts cannot be negative");
    }

    return true;
  }
}
```

### **2. Minimal Edge Case Coverage**

Focus on these 6 essential edge cases to handle 90% of real-world scenarios for Nigerian SMEs:

1. **Overpayment** → Create credit balance
2. **First payment** → Create credit balance or apply to future
3. **Mixed payment validation** → Ensure amounts sum correctly
4. **Credit balance usage** → Automatic application to new purchases
5. **Precision handling** → All calculations in kobo
6. **Status transitions** → Simple 3-state model (pending/partial/completed)

This covers the critical calculation edge cases without over-engineering the system.
