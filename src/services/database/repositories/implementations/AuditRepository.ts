import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseError } from "../../service/utilService";
import { IAuditLogEntry } from "../interfaces/IAuditRepository";

// Audit Repository Implementation
export class AuditRepository {
  constructor(private db: SQLiteDatabase) {}

  async log(entry: Omit<IAuditLogEntry, "id" | "timestamp">): Promise<void> {
    try {
      const auditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...entry,
      };

      await this.db.runAsync(
        `INSERT INTO audit_log (id, tableName, operation, recordId, oldValues, newValues, timestamp, userId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditEntry.id,
          auditEntry.tableName,
          auditEntry.operation,
          auditEntry.recordId,
          auditEntry.oldValues ? JSON.stringify(auditEntry.oldValues) : null,
          auditEntry.newValues ? JSON.stringify(auditEntry.newValues) : null,
          auditEntry.timestamp,
          entry.userId || null,
        ]
      );
    } catch (error) {
      // Don't throw - audit logging shouldn't break main operations
      console.warn("Failed to log audit entry:", error);
    }
  }

  async getAuditLog(
    tableName?: string,
    recordId?: string,
    operation?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<IAuditLogEntry[]> {
    try {
      let sql = "SELECT * FROM audit_log";
      const params: any[] = [];
      const conditions: string[] = [];

      if (tableName) {
        conditions.push("tableName = ?");
        params.push(tableName);
      }

      if (recordId) {
        conditions.push("recordId = ?");
        params.push(recordId);
      }

      if (operation) {
        conditions.push("operation = ?");
        params.push(operation);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      sql += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const results = await this.db.getAllAsync<any>(sql, params);

      return results.map((result) => ({
        ...result,
        oldValues: result.oldValues ? JSON.parse(result.oldValues) : undefined,
        newValues: result.newValues ? JSON.parse(result.newValues) : undefined,
      }));
    } catch (error) {
      throw new DatabaseError("getAuditLog", error as Error);
    }
  }

  async getAuditLogForRecord(
    tableName: string,
    recordId: string
  ): Promise<IAuditLogEntry[]> {
    return this.getAuditLog(tableName, recordId);
  }

  async cleanupOldEntries(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date(
        Date.now() - olderThanDays * 24 * 60 * 60 * 1000
      ).toISOString();

      const result = await this.db.runAsync(
        "DELETE FROM audit_log WHERE timestamp < ?",
        [cutoffDate]
      );

      return result.changes || 0;
    } catch (error) {
      throw new DatabaseError("cleanupOldEntries", error as Error);
    }
  }
}
