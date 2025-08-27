import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook to access database with initialization checking
 */
export function useDatabase() {
  const db = useSQLiteContext();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkDatabaseReady = async () => {
      try {
        // Simple query to check if database is ready
        await db.getFirstAsync("SELECT 1");
        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error("Database not ready:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsReady(false);
      }
    };

    checkDatabaseReady();
  }, [db]);

  return {
    db,
    isReady,
    error,
  };
}

/**
 * Hook for database health monitoring
 */
export function useDatabaseHealth() {
  const { db } = useDatabase();
  const [health, setHealth] = useState<{
    isHealthy: boolean;
    lastChecked: Date | null;
    error?: string;
  }>({
    isHealthy: false,
    lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    try {
      // Check basic connectivity
      await db.getFirstAsync("SELECT sqlite_version() as version");

      // Check if tables exist
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const hasRequiredTables =
        tables.some((t) => t.name === "customers") &&
        tables.some((t) => t.name === "transactions");

      setHealth({
        isHealthy: hasRequiredTables,
        lastChecked: new Date(),
        error: hasRequiredTables ? undefined : "Missing required tables",
      });

      return hasRequiredTables;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setHealth({
        isHealthy: false,
        lastChecked: new Date(),
        error: errorMessage,
      });
      return false;
    }
  }, [db]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    ...health,
    checkHealth,
  };
}

/**
 * Hook for development/debugging utilities
 */
export function useDatabaseDebug() {
  const { db } = useDatabase();

  const getSchema = useCallback(async () => {
    return await db.getAllAsync(
      "SELECT sql FROM sqlite_master WHERE type='table'"
    );
  }, [db]);

  const getTableInfo = useCallback(
    async (tableName: string) => {
      return await db.getAllAsync(`PRAGMA table_info(${tableName})`);
    },
    [db]
  );

  const getIndexes = useCallback(async () => {
    return await db.getAllAsync(
      "SELECT name, sql FROM sqlite_master WHERE type='index'"
    );
  }, [db]);

  const getVersion = useCallback(async () => {
    const result = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version"
    );
    return result?.user_version || 0;
  }, [db]);

  const getDatabaseStats = useCallback(async () => {
    const stats = await Promise.all([
      db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM customers"
      ),
      db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM transactions"
      ),
      db.getFirstAsync<{ version: string }>(
        "SELECT sqlite_version() as version"
      ),
      getVersion(),
    ]);

    return {
      customers: stats[0]?.count || 0,
      transactions: stats[1]?.count || 0,
      sqliteVersion: stats[2]?.version || "unknown",
      schemaVersion: stats[3],
    };
  }, [db, getVersion]);

  return {
    getSchema,
    getTableInfo,
    getIndexes,
    getVersion,
    getDatabaseStats,
  };
}
