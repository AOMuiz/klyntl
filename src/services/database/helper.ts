// database/helper.ts
import { Platform } from "react-native";

import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

// Helper to open a database connection
export const getDatabaseInstance = async (
  dbName: string
): Promise<SQLite.SQLiteDatabase> => {
  return await SQLite.openDatabaseAsync(dbName);
};

// Helper to execute a query with parameters
export const executeQuery = async (
  db: SQLite.SQLiteDatabase,
  query: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> => {
  try {
    const result = await db.runAsync(query, params);
    return result;
  } catch (error) {
    console.error(`SQL Error: ${query}`, error);
    throw error;
  }
};

// Helper to execute a query and get results
export const executeQueryForResults = async <T = any>(
  db: SQLite.SQLiteDatabase,
  query: string,
  params: any[] = []
): Promise<T[]> => {
  try {
    const result = (await db.getAllAsync(query, params)) as T[];
    return result;
  } catch (error) {
    console.error(`SQL Error: ${query}`, error);
    throw error;
  }
};

// Helper to execute a query and get first result
export const executeQueryForFirstResult = async <T = any>(
  db: SQLite.SQLiteDatabase,
  query: string,
  params: any[] = []
): Promise<T | null> => {
  try {
    const result = (await db.getFirstAsync(query, params)) as T | null;
    return result;
  } catch (error) {
    console.error(`SQL Error: ${query}`, error);
    throw error;
  }
};

// Check if a table exists
export const checkTableExists = async (
  db: SQLite.SQLiteDatabase,
  tableName: string
): Promise<boolean> => {
  const query =
    Platform.OS === "ios"
      ? `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      : `SELECT name FROM sqlite_master WHERE type='table' AND name=? COLLATE NOCASE`;

  try {
    const result = await executeQueryForResults(db, query, [tableName]);
    return result.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    throw error;
  }
};

// Generic table initialization
export const initializeTable = async (
  db: SQLite.SQLiteDatabase,
  tableName: string,
  createTableQuery: string,
  createIndexQuery?: string
): Promise<boolean> => {
  try {
    // Check if the table already exists
    const tableExists = await checkTableExists(db, tableName);
    if (tableExists) {
      console.log(`Table "${tableName}" already exists`);
      return true;
    }

    // Create the table
    await executeQuery(db, createTableQuery);

    // Optional: Create an index for faster queries
    if (createIndexQuery) {
      await executeQuery(db, createIndexQuery);
    }

    // Verify the table creation
    const verifyTable = await checkTableExists(db, tableName);
    if (!verifyTable) {
      throw new Error(`Table creation failed for ${tableName}`);
    }

    console.log(`Table "${tableName}" created successfully`);
    return true;
  } catch (error) {
    console.error(`Error initializing table "${tableName}":`, error);
    throw error;
  }
};

// Validate database connection
export const validateDatabaseConnection = async (
  db: SQLite.SQLiteDatabase
): Promise<boolean> => {
  try {
    await executeQuery(db, "SELECT 1");
    return true;
  } catch (error) {
    console.error("Database connection validation failed:", error);
    return false;
  }
};

// Reset all databases
export const resetAllDatabases = async (): Promise<void> => {
  try {
    const dbDirectory = FileSystem.documentDirectory || "";
    const dbFilePaths = [
      `${dbDirectory}mutoons.db`,
      `${dbDirectory}quran.db`,
      `${dbDirectory}lastplayed.db`, // Add other database names here
    ];

    for (const path of dbFilePaths) {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        console.log(`Deleting database: ${path}`);
        await FileSystem.deleteAsync(path);
        console.log(`Database ${path} deleted successfully.`);
      } else {
        console.log(`Database ${path} does not exist.`);
      }
    }

    console.log("All databases reset successfully.");
  } catch (error) {
    console.error("Error resetting databases:", error);
  }
};

// Drop old tables
export const dropOldTable = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  try {
    await executeQuery(db, "DROP TABLE IF EXISTS mutoons");
    await executeQuery(db, "DROP TABLE IF EXISTS recitations");
    console.log("Database tables dropped");
  } catch (error) {
    console.error("Error dropping tables:", error);
    throw error;
  }
};

// Enable WAL mode
export const enableWALMode = async (
  db: SQLite.SQLiteDatabase
): Promise<boolean> => {
  try {
    await executeQuery(db, "PRAGMA journal_mode=WAL");
    console.log("WAL mode enabled successfully.");
    return true;
  } catch (error) {
    console.error("Failed to enable WAL mode:", error);
    throw error;
  }
};

/**
 * Executes a SQL query with retry logic using exponential backoff
 */
export const executeWithRetryBackoff = async (
  db: SQLite.SQLiteDatabase,
  query: string,
  args: any[] = [],
  retries: number = 3,
  delayTime: number = 1000
): Promise<SQLite.SQLiteRunResult> => {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await executeQuery(db, query, args);
    } catch (error) {
      lastError = error as Error;

      if (attempt === retries) {
        console.error("SQL query failed after all retries:", lastError.message);
        throw lastError;
      }

      if (lastError.message.includes("database is locked")) {
        const waitTime = delayTime * Math.pow(2, attempt);
        console.warn(
          `Database locked. Retrying query in ${waitTime}ms... (${
            retries - attempt
          } retries left)`
        );
        await delay(waitTime);
      } else {
        // If it's not a locking issue, don't retry
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Unknown error occurred");
};

/**
 * Execute multiple queries in a transaction
 */
export const executeTransaction = async (
  db: SQLite.SQLiteDatabase,
  queries: { query: string; params?: any[] }[]
): Promise<void> => {
  try {
    await db.withTransactionAsync(async () => {
      for (const { query, params = [] } of queries) {
        await db.runAsync(query, params);
      }
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
};
