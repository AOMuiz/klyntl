import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import React, { ReactNode, useCallback } from "react";
import { runMigrations } from "./migrations";

/**
 * Enhanced database initialization with proper error handling and logging
 */
async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    console.log("Initializing database...");

    // Set SQLite configuration
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA temp_store = memory;
      PRAGMA mmap_size = 268435456;
    `);

    // Run all pending migrations
    await runMigrations(db);

    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw new Error(
      `Failed to initialize database: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Database Provider with improved error handling and initialization
 */
interface DatabaseProviderProps {
  children: ReactNode;
  databaseName?: string;
  onError?: (error: Error) => void;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = React.memo(
  ({ children, databaseName = "klyntl.db", onError }) => {
    const handleError = useCallback(
      (error: Error) => {
        console.error("SQLiteProvider error:", error);

        // Call custom error handler if provided
        if (onError) {
          onError(error);
        } else {
          // Default error handling - you might want to show a user-friendly message
          console.error("Database error occurred. Please restart the app.");
        }
      },
      [onError]
    );

    const handleInit = useCallback(async (db: SQLiteDatabase) => {
      await initializeDatabase(db);
    }, []);

    return (
      <SQLiteProvider
        databaseName={databaseName}
        onInit={handleInit}
        onError={handleError}
        options={{
          enableChangeListener: true, // Enable real-time database change notifications
          useNewConnection: false,
        }}
      >
        {children}
      </SQLiteProvider>
    );
  }
);

DatabaseProvider.displayName = "DatabaseProvider";
