import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogEntry, DatabaseConfig } from "../types";

// ===== SIMPLE AUDIT LOG SERVICE =====
export class AuditLogService {
  constructor(private db: SQLiteDatabase, private config: DatabaseConfig) {}

  async logEntry(
    entry: Omit<AuditLogEntry, "id" | "timestamp">
  ): Promise<void> {
    // Only log if audit is enabled and it's a critical operation
    if (!this.config.enableAuditLog) return;

    // Only log critical operations to reduce complexity
    const criticalOperations = ["CREATE", "DELETE"];
    const criticalTables = ["transactions", "customers", "products"];

    if (
      !criticalOperations.includes(entry.operation) ||
      !criticalTables.includes(entry.tableName)
    ) {
      return;
    }

    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        id: generateId("audit"),
        timestamp: new Date().toISOString(),
      };

      await this.db.runAsync(
        `INSERT INTO audit_log (id, tableName, operation, recordId, oldValues, newValues, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          auditEntry.id,
          auditEntry.tableName,
          auditEntry.operation,
          auditEntry.recordId,
          auditEntry.oldValues ? JSON.stringify(auditEntry.oldValues) : null,
          auditEntry.newValues ? JSON.stringify(auditEntry.newValues) : null,
          auditEntry.timestamp,
        ]
      );
    } catch (error) {
      // Don't throw - audit logging shouldn't break main operations
      console.warn("Failed to log audit entry:", error);
    }
  }

  // Simplified audit retrieval - just get recent entries
  async getRecentAuditEntries(limit: number = 50): Promise<AuditLogEntry[]> {
    if (!this.config.enableAuditLog) {
      return [];
    }

    try {
      const results = await this.db.getAllAsync<any>(
        "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?",
        [limit]
      );

      return results.map((result) => ({
        ...result,
        oldValues: result.oldValues ? JSON.parse(result.oldValues) : undefined,
        newValues: result.newValues ? JSON.parse(result.newValues) : undefined,
      }));
    } catch (error) {
      console.warn("Failed to get audit entries:", error);
      return [];
    }
  }
}
