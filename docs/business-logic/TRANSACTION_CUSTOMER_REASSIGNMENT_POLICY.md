# Transaction Customer Reassignment Policy

## Overview

This document outlines the business logic and technical considerations for allowing or prohibiting the reassignment of transaction customers after creation.

## Current State

- Transactions are currently created with a fixed `customerId`
- No mechanism exists to change the customer associated with a transaction
- Customer totals and outstanding balances are calculated based on transaction history

## Business Considerations

### Arguments For Allowing Reassignment

- **Data Entry Errors**: Transactions may be created for the wrong customer due to user error
- **Customer Merging**: When customers are merged or consolidated
- **Business Restructuring**: Changes in business ownership or customer relationships
- **Flexibility**: Accommodates real-world business scenarios

### Arguments Against Allowing Reassignment

- **Financial Integrity**: Transactions should be immutable for audit and compliance purposes
- **Balance Accuracy**: Changing customers affects outstanding balances and financial reporting
- **Audit Trail**: Reassignment could mask original transaction intent
- **Complexity**: Introduces significant business logic complexity

## Recommended Approach

### Default Policy: RESTRICTED

**Recommendation**: Do NOT allow customer reassignment by default.

**Rationale**:

- Maintains financial data integrity
- Simplifies balance calculations
- Reduces audit complexity
- Aligns with accounting best practices

### Exception Cases

Allow reassignment ONLY in these specific scenarios:

1. **Data Entry Corrections** (within 24 hours)

   - Only for transactions created in the last 24 hours
   - Requires manager/admin approval
   - Must include correction reason

2. **Customer Merging** (administrative action)

   - When duplicate customers are identified and merged
   - Requires full audit trail
   - Updates all related balances atomically

3. **Business Corrections** (rare administrative override)
   - Only for legitimate business errors
   - Requires C-level approval
   - Full audit documentation required

## Technical Implementation

### If Implementing Reassignment

#### Database Changes

- Add `transaction_reassignments` audit table
- Track: `old_customer_id`, `new_customer_id`, `transaction_id`, `reason`, `approved_by`, `timestamp`

#### Business Logic

- Atomic balance updates for both customers
- Recalculation of outstanding balances
- Update of customer totals
- Audit log creation

#### UI/UX

- "Change Customer" button (permission-gated)
- Confirmation dialog showing balance impacts
- Reason input field
- Admin approval workflow

#### Code Structure

```typescript
// Permission check
if (!userHasPermission("transaction.reassign")) {
  return <ReadOnlyCustomerSelector />;
}

// Reassignment flow
const handleReassign = async (newCustomerId: string, reason: string) => {
  await reassignTransaction({
    transactionId,
    newCustomerId,
    reason,
    approvedBy: currentUser.id,
  });
};
```

## Alternative Solutions

### For Data Entry Errors

1. **Void and Recreate**: Void the incorrect transaction and create a new one
2. **Correction Entries**: Create adjusting entries to correct balances
3. **Note Fields**: Add correction notes to transaction descriptions

### For Customer Merging

1. **Merge Tool**: Dedicated customer merge functionality
2. **Bulk Reassignment**: Administrative tool for bulk transaction reassignment
3. **Data Migration**: One-time migration scripts for legacy data

## Implementation Priority

### Phase 1: Prevention (HIGH PRIORITY)

- Improve customer selection UX to prevent errors
- Add customer search and validation
- Implement customer selection confirmation

### Phase 2: Correction Tools (MEDIUM PRIORITY)

- Void transaction functionality
- Transaction correction notes
- Improved error messaging

### Phase 3: Limited Reassignment (LOW PRIORITY)

- 24-hour correction window
- Admin approval workflow
- Full audit logging

## Conclusion

**Recommendation**: Implement Phase 1 and 2 first to prevent errors, then consider limited reassignment capabilities if business requirements demand it.

The default stance should be: **Transactions are immutable** - if a change is needed, void the transaction and create a new one with proper documentation.

This approach maintains data integrity while providing flexibility for genuine business needs.
