/**
 * Database Debug Utilities for Klyntl
 *
 * This module provides utilities to:
 * 1. Export the app's SQLite database to a local file
 * 2. Create debug snapshots of the database
 * 3. Analyze database consistency issues
 * 4. Generate test data for debugging
 */

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as SQLite from "expo-sqlite";
import { Alert } from "react-native";

const DB_NAME = "klyntl.db";

/**
 * Export the current app database to a shareable file
 */
export async function exportDatabase(): Promise<string | null> {
  try {
    console.log("Starting database export...");

    // Get the database path in app documents directory
    const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
    const exportPath = `${
      FileSystem.documentDirectory
    }klyntl-export-${Date.now()}.db`;

    // Check if database exists
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    if (!dbInfo.exists) {
      throw new Error(`Database not found at ${dbPath}`);
    }

    // Copy database to export location
    await FileSystem.copyAsync({
      from: dbPath,
      to: exportPath,
    });

    console.log(`Database exported to: ${exportPath}`);
    return exportPath;
  } catch (error) {
    console.error("Database export failed:", error);
    return null;
  }
}

/**
 * Share the exported database file
 */
export async function shareDatabase(): Promise<void> {
  try {
    const exportPath = await exportDatabase();

    if (!exportPath) {
      Alert.alert("Error", "Failed to export database");
      return;
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      await Sharing.shareAsync(exportPath, {
        mimeType: "application/x-sqlite3",
        dialogTitle: "Share Klyntl Database",
      });
    } else {
      Alert.alert(
        "Database Exported",
        `Database saved to: ${exportPath}\n\nYou can find it in the app's documents directory.`
      );
    }
  } catch (error) {
    console.error("Database sharing failed:", error);
    Alert.alert("Error", "Failed to share database");
  }
}

/**
 * Create a debug snapshot with customer and transaction data
 */
export async function createDebugSnapshot(): Promise<string> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Get summary statistics
    const customerCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM customers"
    );
    const transactionCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM transactions"
    );

    // Get customers with balance discrepancies
    const customers = await db.getAllAsync(`
      SELECT 
        c.id,
        c.name,
        c.outstandingBalance,
        c.creditBalance,
        COALESCE(SUM(CASE WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount ELSE 0 END), 0) as computed_debt,
        COALESCE(SUM(CASE WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN t.amount ELSE 0 END), 0) as total_payments
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customerId AND t.isDeleted = 0
      GROUP BY c.id, c.name, c.outstandingBalance, c.creditBalance
      HAVING c.outstandingBalance != computed_debt
      ORDER BY ABS(c.outstandingBalance - computed_debt) DESC
      LIMIT 10
    `);

    // Get recent transactions
    const recentTransactions = await db.getAllAsync(`
      SELECT 
        t.*,
        c.name as customerName
      FROM transactions t
      JOIN customers c ON t.customerId = c.id
      WHERE t.isDeleted = 0
      ORDER BY t.date DESC
      LIMIT 20
    `);

    const snapshot = {
      timestamp: new Date().toISOString(),
      summary: {
        customers: customerCount?.count || 0,
        transactions: transactionCount?.count || 0,
        discrepancies: customers.length,
      },
      balanceDiscrepancies: customers,
      recentTransactions,
    };

    // Save snapshot to file
    const snapshotPath = `${
      FileSystem.documentDirectory
    }debug-snapshot-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(
      snapshotPath,
      JSON.stringify(snapshot, null, 2)
    );

    console.log("Debug snapshot created:", snapshot);
    return snapshotPath;
  } catch (error) {
    console.error("Failed to create debug snapshot:", error);
    throw error;
  }
}

/**
 * Analyze database consistency and return a report
 */
export async function analyzeDatabase(): Promise<any> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Check for balance discrepancies
    const discrepancies = await db.getAllAsync(`
      SELECT 
        c.id,
        c.name,
        c.outstandingBalance as stored_balance,
        COALESCE(SUM(CASE 
          WHEN t.type IN ('sale', 'credit') THEN t.remainingAmount 
          WHEN t.type = 'payment' AND t.appliedToDebt = 1 THEN -t.amount
          WHEN t.type = 'refund' THEN -t.amount
          ELSE 0 
        END), 0) as computed_balance
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customerId AND t.isDeleted = 0
      GROUP BY c.id, c.name, c.outstandingBalance
      HAVING stored_balance != computed_balance
    `);

    // Check for orphaned transactions
    const orphanedTransactions = await db.getAllAsync(`
      SELECT t.* 
      FROM transactions t
      LEFT JOIN customers c ON t.customerId = c.id
      WHERE c.id IS NULL AND t.isDeleted = 0
    `);

    // Check for transactions without proper status
    const invalidStatuses = await db.getAllAsync(`
      SELECT *
      FROM transactions
      WHERE (
        (remainingAmount = 0 AND status != 'completed') OR
        (remainingAmount > 0 AND remainingAmount < amount AND status != 'partial') OR
        (remainingAmount = amount AND status != 'pending')
      ) AND isDeleted = 0
    `);

    return {
      balanceDiscrepancies: discrepancies,
      orphanedTransactions,
      invalidStatuses,
      summary: {
        discrepancyCount: discrepancies.length,
        orphanedCount: orphanedTransactions.length,
        invalidStatusCount: invalidStatuses.length,
        isHealthy:
          discrepancies.length === 0 &&
          orphanedTransactions.length === 0 &&
          invalidStatuses.length === 0,
      },
    };
  } catch (error) {
    console.error("Database analysis failed:", error);
    throw error;
  }
}

/**
 * Import a database file (for testing purposes)
 */
export async function importDatabase(importPath: string): Promise<boolean> {
  try {
    console.log(`Importing database from: ${importPath}`);

    const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

    // Backup current database
    const backupPath = `${
      FileSystem.documentDirectory
    }klyntl-backup-${Date.now()}.db`;
    const currentDbInfo = await FileSystem.getInfoAsync(dbPath);

    if (currentDbInfo.exists) {
      await FileSystem.copyAsync({
        from: dbPath,
        to: backupPath,
      });
      console.log(`Current database backed up to: ${backupPath}`);
    }

    // Copy imported database to app location
    await FileSystem.copyAsync({
      from: importPath,
      to: dbPath,
    });

    console.log("Database import completed successfully");
    return true;
  } catch (error) {
    console.error("Database import failed:", error);
    return false;
  }
}
