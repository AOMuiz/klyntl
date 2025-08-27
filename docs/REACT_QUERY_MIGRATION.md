# React Query Migration Guide

This guide shows how to migrate from Zustand-based data management to React Query + SQLite hooks.

## Overview

### Before (Zustand)

```typescript
// ❌ Old way - manual cache management
const store = useTransactionStore();
const { transactions, loading, error } = store;

useEffect(() => {
  store.fetchTransactions();
}, []);

const handleCreate = async (data) => {
  await store.createTransaction(data);
  // Manual cache invalidation
  store.fetchTransactions();
};
```

### After (React Query)

```typescript
// ✅ New way - automatic cache management
const { transactions, isLoading, error, createTransaction } = useTransactions();

const handleCreate = (data) => {
  createTransaction(data); // Automatically updates cache
};
```

## Migration Steps

### 1. Update App Root

Replace your current app root with the new Providers:

```typescript
// app/_layout.tsx or App.tsx
import { Providers } from "../src/providers";

export default function RootLayout() {
  return <Providers>{/* Your app content */}</Providers>;
}
```

### 2. Replace Store Usage

#### Customer Management

**Before:**

```typescript
import { useCustomerStore } from "../stores/customerStore";

function CustomerList() {
  const store = useCustomerStore();

  useEffect(() => {
    store.fetchCustomers();
  }, []);

  const handleCreate = async (data) => {
    await store.createCustomer(data);
    await store.fetchCustomers(); // Manual refresh
  };

  return (
    <div>
      {store.loading && <div>Loading...</div>}
      {store.error && <div>Error: {store.error}</div>}
      {store.customers.map((customer) => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

**After:**

```typescript
import { useCustomers } from "../hooks/useCustomers";

function CustomerList() {
  const { customers, isLoading, error, createCustomer } = useCustomers();

  const handleCreate = (data) => {
    createCustomer(data); // Automatic cache update
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {customers.map((customer) => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

#### Transaction Management

**Before:**

```typescript
import { useTransactionStore } from "../stores/transactionStore";

function TransactionList({ customerId }) {
  const store = useTransactionStore();

  useEffect(() => {
    store.fetchTransactions(customerId);
  }, [customerId]);

  return (
    <div>
      {store.loading && <div>Loading...</div>}
      {store.transactions.map((txn) => (
        <div key={txn.id}>{txn.description}</div>
      ))}
    </div>
  );
}
```

**After:**

```typescript
import { useTransactions } from "../hooks/useTransactions";

function TransactionList({ customerId }) {
  const { transactions, isLoading } = useTransactions(customerId);

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {transactions.map((txn) => (
        <div key={txn.id}>{txn.description}</div>
      ))}
    </div>
  );
}
```

### 3. Handle UI State with Updated Store

Keep Zustand only for UI state:

```typescript
import { useUiStore } from "../stores/uiStore";

function CustomerFilters() {
  const { filters, updateFilters } = useCustomerFilters();

  return (
    <input
      value={filters.searchQuery}
      onChange={(e) => updateFilters({ searchQuery: e.target.value })}
    />
  );
}
```

### 4. Advanced Patterns

#### Optimistic Updates

```typescript
const { createCustomer } = useCustomers();

// Optimistic update with error handling
const handleCreate = (data) => {
  createCustomer(data, {
    onError: (error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
    onSuccess: (customer) => {
      toast.success(`Created ${customer.name}`);
    },
  });
};
```

#### Dependent Queries

```typescript
function CustomerDetails({ customerId }) {
  // Customer data
  const { data: customer } = useCustomer(customerId);

  // Transactions for this customer (depends on customer existing)
  const { transactions } = useTransactions(customer?.id);

  return (
    <div>
      <h1>{customer?.name}</h1>
      <TransactionList transactions={transactions} />
    </div>
  );
}
```

#### Background Refetching

```typescript
const { refetch } = useCustomers();

// Refresh data every 5 minutes
useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, [refetch]);
```

## Benefits of Migration

### ✅ What You Gain

1. **Automatic Caching**: No more manual cache management
2. **Background Updates**: Data stays fresh automatically
3. **Optimistic Updates**: UI updates immediately
4. **Error Recovery**: Built-in retry and error handling
5. **Performance**: Query deduplication and intelligent refetching
6. **Developer Experience**: Better DevTools and debugging

### ❌ What You Remove

1. **Manual Loading States**: React Query handles this
2. **Manual Error Handling**: Built-in error states
3. **Manual Cache Invalidation**: Automatic with mutations
4. **Boilerplate Code**: Less code overall

## Files to Remove/Update

### Remove These Files:

- `src/stores/customerStore.ts`
- `src/stores/transactionStore.ts`
- `src/stores/analyticsStore.ts`

### Update These Files:

- `src/stores/uiStore.ts` (keep for UI state only)
- All components using the old stores

### Add These Files:

- `src/hooks/useCustomers.ts`
- `src/hooks/useTransactions.ts`
- `src/hooks/useAnalytics.ts`
- `src/hooks/useDatabaseUtils.ts`
- `src/providers/index.tsx`

## Testing the Migration

1. **Verify Database Connection**: Use `useDatabaseConnection()` hook
2. **Check Data Flow**: Ensure create/update/delete operations work
3. **Test Error Handling**: Verify error states display correctly
4. **Validate Performance**: Check that data doesn't over-fetch

## Rollback Plan

If you need to rollback:

1. Keep the old store files as backup
2. Switch imports back to old stores
3. Remove React Query providers
4. The database service layer remains compatible

## Next Steps

After migration:

1. Add React Query DevTools for development
2. Implement proper error boundaries
3. Add offline support with React Query persistence
4. Optimize queries with proper keys and stale times
