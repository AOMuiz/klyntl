/**
 * Example of how to use the new database system
 */

import {
  createDatabaseService,
  DatabaseProvider,
  useDatabase,
  useDatabaseHealth,
} from "@/services/database";
import { Button, Text, View } from "react-native";

// Component that uses the database
function DatabaseExample() {
  const { db, isReady, error } = useDatabase();
  const { isHealthy, lastChecked, checkHealth } = useDatabaseHealth();

  const handleTestDatabase = async () => {
    if (!isReady) {
      console.log("Database not ready yet");
      return;
    }

    try {
      // Create a database service instance
      const dbService = createDatabaseService(db);

      // Test creating a customer
      const customer = await dbService.createCustomer({
        name: "Test Customer",
        phone: "+1234567890",
        email: "test@example.com",
      });

      console.log("Created customer:", customer);

      // Get all customers
      const customers = await dbService.getCustomers();
      console.log("All customers:", customers);
    } catch (err) {
      console.error("Database operation failed:", err);
    }
  };

  if (error) {
    return (
      <View>
        <Text>Database Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Database Status: {isReady ? "Ready" : "Not Ready"}</Text>
      <Text>Health: {isHealthy ? "Healthy" : "Unhealthy"}</Text>
      <Text>Last Checked: {lastChecked?.toLocaleString() || "Never"}</Text>

      <Button
        title="Test Database"
        onPress={handleTestDatabase}
        disabled={!isReady}
      />

      <Button title="Check Health" onPress={checkHealth} />
    </View>
  );
}

// App component with database provider
export function DatabaseExampleApp() {
  return (
    <DatabaseProvider
      databaseName="klyntl.db"
      onError={(error) => {
        console.error("Database error:", error);
        // You could show a user-friendly error message here
      }}
    >
      <DatabaseExample />
    </DatabaseProvider>
  );
}

/**
 * Usage patterns:
 *
 * 1. Simple CRUD operations:
 * ```typescript
 * const { db, isReady } = useDatabase();
 * const dbService = createDatabaseService(db);
 *
 * // Create
 * const customer = await dbService.createCustomer({ name, phone });
 *
 * // Read
 * const customers = await dbService.getCustomers();
 * const customer = await dbService.getCustomerById(id);
 *
 * // Update
 * await dbService.updateCustomer(id, { name: 'New Name' });
 *
 * // Delete
 * await dbService.deleteCustomer(id);
 * ```
 *
 * 2. Advanced filtering:
 * ```typescript
 * const customers = await dbService.getCustomersWithFilters(
 *   'search query',
 *   {
 *     customerType: 'business',
 *     spendingRange: { min: 100, max: 1000 },
 *     isActive: true,
 *   },
 *   { field: 'totalSpent', direction: 'desc' },
 *   0, // page
 *   20 // pageSize
 * );
 * ```
 *
 * 3. Database health monitoring:
 * ```typescript
 * const { isHealthy, checkHealth } = useDatabaseHealth();
 *
 * useEffect(() => {
 *   if (!isHealthy) {
 *     checkHealth();
 *   }
 * }, [isHealthy]);
 * ```
 *
 * 4. Development/debugging:
 * ```typescript
 * const { getSchema, getDatabaseStats } = useDatabaseDebug();
 *
 * const stats = await getDatabaseStats();
 * console.log('Database stats:', stats);
 * ```
 */
