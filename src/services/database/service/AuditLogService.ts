import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogEntry, DatabaseConfig } from "../types";
import { DatabaseError } from "./utilService";

// ===== AUDIT LOG SERVICE =====
export class AuditLogService {
  constructor(private db: SQLiteDatabase, private config: DatabaseConfig) {}

  async logEntry(
    entry: Omit<AuditLogEntry, "id" | "timestamp">
  ): Promise<void> {
    if (!this.config.enableAuditLog) return;

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
      console.warn("Failed to log audit entry:", error);
    }
  }

  async getAuditLog(
    tableName?: string,
    recordId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    if (!this.config.enableAuditLog) {
      return [];
    }

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
}
