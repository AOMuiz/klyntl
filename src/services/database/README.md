# Modern Database System for Klyntl

This document explains the improved database initialization and migration system using the latest Expo SQLite features.

## Key Improvements

### 🔧 **Reduced Error-Prone Points**

- ✅ Single source of truth for migrations
- ✅ Proper transaction handling
- ✅ Type-safe database operations
- ✅ Comprehensive error handling
- ✅ No more sync/async fallbacks

### 🚀 **Modern Architecture**

- ✅ Structured migration system
- ✅ React hooks for database access
- ✅ Health monitoring
- ✅ Debug utilities
- ✅ Clean separation of concerns

### 📱 **Developer Experience**

- ✅ Easy to understand structure
- ✅ Clear migration steps
- ✅ Built-in debugging tools
- ✅ Comprehensive examples

## File Structure

```
src/services/database/
├── context.tsx          # Database provider with enhanced error handling
├── migrations.ts        # Structured migration system
├── service.ts          # Modern database service class
├── hooks.ts            # React hooks for database access
├── examples.tsx        # Usage examples
├── helper.ts           # Legacy helper functions
└── index.ts            # Original (legacy) implementation
```

## Quick Start

### 1. Basic Setup

```tsx
import { DatabaseProvider } from "@/services/database/context";

export default function App() {
  return (
    <DatabaseProvider
      databaseName="klyntl.db"
      onError={(error) => console.error("DB Error:", error)}
    >
      <YourAppComponents />
    </DatabaseProvider>
  );
}
```

### 2. Using the Database

```tsx
import { useDatabase, createDatabaseService } from "@/services/database";

function MyComponent() {
  const { db, isReady, error } = useDatabase();

  const handleCreateCustomer = async () => {
    if (!isReady) return;

    const dbService = createDatabaseService(db);
    const customer = await dbService.createCustomer({
      name: "John Doe",
      phone: "+1234567890",
    });
  };

  if (error) return <ErrorComponent error={error} />;
  if (!isReady) return <LoadingComponent />;

  return <YourComponent />;
}
```

## Migration System

### Adding New Migrations

```typescript
// In migrations.ts
const migration003: Migration = {
  version: 3,
  name: "add_customer_tags",
  up: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      ALTER TABLE customers ADD COLUMN tags TEXT;
      CREATE INDEX IF NOT EXISTS idx_customer_tags ON customers(tags);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_customer_tags;
      -- Note: SQLite doesn't support DROP COLUMN
    `);
  },
};

// Add to migrations array
export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003, // <- Add here
];
```

### Migration Features

- **Automatic Execution**: Migrations run automatically on app start
- **Transaction Safety**: All migrations run in transactions
- **Rollback Support**: Each migration can define a rollback
- **Version Tracking**: Database version is tracked automatically
- **Error Recovery**: Failed migrations rollback automatically

## Database Operations

### CRUD Operations

```typescript
const dbService = createDatabaseService(db);

// Create
const customer = await dbService.createCustomer({
  name: "Jane Smith",
  phone: "+1987654321",
  email: "jane@example.com",
  company: "Acme Corp",
});

// Read
const customers = await dbService.getCustomers("search query");
const customer = await dbService.getCustomerById("cust_123");

// Update
await dbService.updateCustomer("cust_123", {
  name: "Jane Doe",
  email: "jane.doe@example.com",
});

// Delete
await dbService.deleteCustomer("cust_123");
```

### Advanced Filtering

```typescript
const customers = await dbService.getCustomersWithFilters(
  "search query",
  {
    customerType: "business",
    spendingRange: { min: 100, max: 1000 },
    dateRange: {
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    },
    isActive: true,
    contactSource: "imported",
  },
  { field: "totalSpent", direction: "desc" },
  0, // page
  20 // pageSize
);
```

## Health Monitoring

```typescript
import { useDatabaseHealth } from "@/services/database/hooks";

function DatabaseHealth() {
  const { isHealthy, lastChecked, error, checkHealth } = useDatabaseHealth();

  useEffect(() => {
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <View>
      <Text>Status: {isHealthy ? "✅ Healthy" : "❌ Unhealthy"}</Text>
      {error && <Text>Error: {error}</Text>}
      <Text>Last Checked: {lastChecked?.toLocaleString()}</Text>
    </View>
  );
}
```

## Debug Utilities

```typescript
import { useDatabaseDebug } from "@/services/database/hooks";

function DatabaseDebug() {
  const { getDatabaseStats, getSchema, getVersion } = useDatabaseDebug();

  const showDebugInfo = async () => {
    const stats = await getDatabaseStats();
    console.log("Database Stats:", stats);

    const schema = await getSchema();
    console.log("Database Schema:", schema);

    const version = await getVersion();
    console.log("Schema Version:", version);
  };

  return <Button title="Show Debug Info" onPress={showDebugInfo} />;
}
```

## Error Handling

### At Provider Level

```tsx
<DatabaseProvider
  onError={(error) => {
    // Log to crash reporting service
    console.error('Database error:', error);

    // Show user-friendly message
    Alert.alert('Database Error', 'Please restart the app');
  }}
>
```

### At Component Level

```tsx
function MyComponent() {
  const { db, isReady, error } = useDatabase();

  if (error) {
    return (
      <View>
        <Text>Something went wrong with the database</Text>
        <Button title="Retry" onPress={() => window.location.reload()} />
      </View>
    );
  }

  // ... rest of component
}
```

## Performance Optimizations

### 1. Proper Indexing

The migration system automatically creates indexes for:

- Customer phone numbers
- Customer names
- Transaction dates
- Foreign key relationships

### 2. WAL Mode

Write-Ahead Logging is enabled for better performance:

```sql
PRAGMA journal_mode = WAL;
```

### 3. Memory Settings

Optimized memory settings:

```sql
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456;
```

### 4. Connection Pooling

The provider reuses connections efficiently.

## Best Practices

### 1. Always Check Database Readiness

```typescript
const { db, isReady } = useDatabase();

if (!isReady) {
  return <LoadingSpinner />;
}
```

### 2. Use Transactions for Multiple Operations

```typescript
await db.withTransactionAsync(async () => {
  await dbService.createCustomer(customer1);
  await dbService.createCustomer(customer2);
  await dbService.createTransaction(transaction);
});
```

### 3. Handle Errors Gracefully

```typescript
try {
  await dbService.createCustomer(customerData);
} catch (error) {
  if (error.message.includes("UNIQUE constraint failed")) {
    // Handle duplicate phone number
    Alert.alert("Error", "A customer with this phone number already exists");
  } else {
    // Handle other errors
    console.error("Failed to create customer:", error);
  }
}
```

### 4. Use Proper Types

```typescript
// Good
const customer: Customer = await dbService.getCustomerById(id);

// Bad
const customer = await dbService.getCustomerById(id);
```

## Migration from Legacy System

If you're migrating from the old system:

1. **Replace imports**:

   ```typescript
   // Old
   import { databaseService } from "@/services/database";

   // New
   import { useDatabase, createDatabaseService } from "@/services/database";
   ```

2. **Update component pattern**:

   ```typescript
   // Old
   useEffect(() => {
     databaseService.getCustomers().then(setCustomers);
   }, []);

   // New
   const { db, isReady } = useDatabase();
   useEffect(() => {
     if (!isReady) return;
     const dbService = createDatabaseService(db);
     dbService.getCustomers().then(setCustomers);
   }, [db, isReady]);
   ```

3. **Remove manual initialization**:

   ```typescript
   // Old - Remove this
   await databaseService.initialize();

   // New - Automatic via provider
   // No initialization needed
   ```

## Troubleshooting

### Database Not Ready

- Check if DatabaseProvider is wrapping your app
- Look for errors in the console during initialization
- Use useDatabaseHealth to monitor status

### Migration Failures

- Check the migration SQL syntax
- Ensure migrations are added to the migrations array
- Use database debug tools to inspect current state

### Performance Issues

- Check if proper indexes are created
- Monitor query complexity
- Use pagination for large result sets

## Development Tools

### Reset Database

```typescript
import { resetDatabase } from "@/services/database/migrations";

// In development only
if (__DEV__) {
  await resetDatabase(db);
}
```

### Manual Migration

```typescript
import { runMigrations } from "@/services/database/migrations";

// Run to specific version
await runMigrations(db, 2);
```

This modern system provides a robust, maintainable, and scalable foundation for your database operations while reducing common error-prone patterns.
