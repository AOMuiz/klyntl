import { StoreConfig, UpdateStoreConfigInput } from "@/types/store";
import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseConfig } from "../service";
import { AuditLogService } from "../service/AuditLogService";
import { DatabaseError, NotFoundError } from "../service/utilService";

// ===== STORE CONFIG REPOSITORY =====
export class StoreConfigRepository {
  constructor(
    private db: SQLiteDatabase,
    private config: DatabaseConfig,
    private auditService: AuditLogService
  ) {}

  async getConfig(): Promise<StoreConfig | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM store_config WHERE id = 'main'"
      );

      if (!result) return null;

      return {
        ...result,
        isActive: result.isActive === 1,
      };
    } catch (error) {
      throw new DatabaseError("getConfig", error as Error);
    }
  }

  async updateConfig(updates: UpdateStoreConfigInput): Promise<void> {
    try {
      // Check if store config exists
      const currentConfig = await this.getConfig();
      if (!currentConfig) {
        throw new NotFoundError("StoreConfig", "main");
      }

      const now = new Date().toISOString();
      const fields = Object.keys(updates);

      if (fields.length === 0) return;

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => {
        const value = (updates as any)[field];
        // Convert boolean to integer for SQLite
        if (field === "isActive" && typeof value === "boolean") {
          return value ? 1 : 0;
        }
        return value;
      });

      await this.db.runAsync(
        `UPDATE store_config SET ${setClause}, updatedAt = ? WHERE id = 'main'`,
        [...values, now]
      );

      await this.auditService.logEntry({
        tableName: "store_config",
        operation: "UPDATE",
        recordId: "main",
        oldValues: currentConfig,
        newValues: { ...currentConfig, ...updates, updatedAt: now },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("updateConfig", error as Error);
    }
  }
}
