import { SQLiteDatabase } from "expo-sqlite";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../../service/utilService";
import { IBaseRepository } from "../interfaces/IBaseRepository";

export interface RepositoryConfig {
  enableAuditLog: boolean;
  maxBatchSize: number;
  customerActiveDays?: number;
  defaultLowStockThreshold?: number;
  enableValidation: boolean;
  enableBusinessRules: boolean;
}

export abstract class BaseRepository<T extends { id: string }>
  implements IBaseRepository<T>
{
  protected readonly config: RepositoryConfig;

  protected constructor(
    protected readonly db: SQLiteDatabase,
    protected readonly tableName: string,
    config: Partial<RepositoryConfig> = {}
  ) {
    this.config = {
      enableAuditLog: false,
      maxBatchSize: 100,
      enableValidation: true,
      enableBusinessRules: true,
      ...config,
    };
  }

  protected abstract mapToEntity(record: any): T;
  protected abstract getCreateQuery(): string;
  protected abstract getUpdateQuery(): string;
  protected abstract getCreateParams(entity: Omit<T, "id">): any[];
  protected abstract getUpdateParams(entity: Partial<T>): any[];

  // New abstract methods for validation
  protected abstract validateCreateData(entity: Omit<T, "id">): Promise<void>;
  protected abstract validateUpdateData(
    id: string,
    entity: Partial<T>
  ): Promise<void>;
  protected abstract generateId(): string;

  // Audit logging helper
  protected async logAudit(
    operation: "CREATE" | "UPDATE" | "DELETE",
    recordId: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    if (!this.config.enableAuditLog) return;

    try {
      const auditId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      await this.db.runAsync(
        `INSERT OR IGNORE INTO audit_log 
         (id, tableName, operation, recordId, oldValues, newValues, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          this.tableName,
          operation,
          recordId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          timestamp,
        ]
      );
    } catch (error) {
      // Don't throw - audit logging shouldn't break operations
      console.warn(`Audit logging failed for ${this.tableName}:`, error);
    }
  }

  // Enhanced create with validation
  async create(entity: Omit<T, "id">): Promise<T> {
    if (this.config.enableValidation) {
      await this.validateCreateData(entity);
    }

    try {
      const query = this.getCreateQuery();
      const result = await this.db.runAsync(
        query,
        this.getCreateParams(entity)
      );

      if (!result.lastInsertRowId) {
        throw new DatabaseError("create", new Error("Failed to create entity"));
      }

      const created = (await this.findById(
        result.lastInsertRowId.toString()
      )) as T;

      await this.logAudit("CREATE", created.id, undefined, created);
      return created;
    } catch (error) {
      throw new DatabaseError(
        "create",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async findById(id: string): Promise<T | null> {
    if (!id?.trim()) {
      throw new ValidationError("ID is required", "id");
    }

    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
      const result = await this.db.getFirstAsync(query, [id]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new DatabaseError(
        "findById",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Enhanced update with validation
  async update(id: string, entity: Partial<T>): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("ID is required", "id");
    }

    if (this.config.enableValidation) {
      await this.validateUpdateData(id, entity);
    }

    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundError(this.tableName, id);
      }

      const fields = Object.keys(entity).filter((key) => key !== "id");
      if (fields.length === 0) return;

      const query = this.getUpdateQuery();
      await this.db.runAsync(query, [...this.getUpdateParams(entity), id]);

      await this.logAudit("UPDATE", id, existing, { ...existing, ...entity });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        "update",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("ID is required", "id");
    }

    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundError(this.tableName, id);
      }

      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      await this.db.runAsync(query, [id]);

      await this.logAudit("DELETE", id, existing, undefined);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        "delete",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async findAll(): Promise<T[]> {
    try {
      const query = `SELECT * FROM ${this.tableName}`;
      const results = await this.db.getAllAsync(query);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError(
        "findAll",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // New batch operations
  async batchCreate(entities: Omit<T, "id">[]): Promise<T[]> {
    if (entities.length === 0) return [];
    if (entities.length > this.config.maxBatchSize) {
      throw new ValidationError(
        `Batch size cannot exceed ${this.config.maxBatchSize}`
      );
    }

    try {
      const results: T[] = [];

      await this.db.withTransactionAsync(async () => {
        for (const entity of entities) {
          if (this.config.enableValidation) {
            await this.validateCreateData(entity);
          }

          const result = await this.db.runAsync(
            this.getCreateQuery(),
            this.getCreateParams(entity)
          );

          if (result.lastInsertRowId) {
            const created = (await this.findById(
              result.lastInsertRowId.toString()
            )) as T;
            results.push(created);
            await this.logAudit("CREATE", created.id, undefined, created);
          }
        }
      });

      return results;
    } catch (error) {
      throw new DatabaseError(
        "batchCreate",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async batchUpdate(
    updates: { id: string; entity: Partial<T> }[]
  ): Promise<void> {
    if (updates.length === 0) return;
    if (updates.length > this.config.maxBatchSize) {
      throw new ValidationError(
        `Batch size cannot exceed ${this.config.maxBatchSize}`
      );
    }

    try {
      await this.db.withTransactionAsync(async () => {
        for (const { id, entity } of updates) {
          if (this.config.enableValidation) {
            await this.validateUpdateData(id, entity);
          }

          const existing = await this.findById(id);
          if (!existing) {
            throw new NotFoundError(this.tableName, id);
          }

          const fields = Object.keys(entity).filter((key) => key !== "id");
          if (fields.length > 0) {
            await this.db.runAsync(this.getUpdateQuery(), [
              ...this.getUpdateParams(entity),
              id,
            ]);

            await this.logAudit("UPDATE", id, existing, {
              ...existing,
              ...entity,
            });
          }
        }
      });
    } catch (error) {
      throw new DatabaseError(
        "batchUpdate",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async batchDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    if (ids.length > this.config.maxBatchSize) {
      throw new ValidationError(
        `Batch size cannot exceed ${this.config.maxBatchSize}`
      );
    }

    try {
      await this.db.withTransactionAsync(async () => {
        // Get existing records for audit log
        const existingRecords = await Promise.all(
          ids.map((id) => this.findById(id))
        );

        // Delete records
        const placeholders = ids.map(() => "?").join(",");
        await this.db.runAsync(
          `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`,
          ids
        );

        // Log audit entries
        for (let i = 0; i < ids.length; i++) {
          if (existingRecords[i]) {
            await this.logAudit(
              "DELETE",
              ids[i],
              existingRecords[i],
              undefined
            );
          }
        }
      });
    } catch (error) {
      throw new DatabaseError(
        "batchDelete",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async exists(id: string): Promise<boolean> {
    if (!id?.trim()) {
      throw new ValidationError("ID is required", "id");
    }

    try {
      const result = await this.db.getFirstAsync<{ exists: number }>(
        `SELECT 1 as exists FROM ${this.tableName} WHERE id = ? LIMIT 1`,
        [id]
      );
      return !!result?.exists;
    } catch (error) {
      throw new DatabaseError(
        "exists",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async count(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );
      return result?.count || 0;
    } catch (error) {
      throw new DatabaseError(
        "count",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Helper method for building WHERE conditions safely
  protected buildWhereClause(
    conditions: { field: string; operator: string; value: any }[],
    searchFields?: string[],
    searchQuery?: string
  ): { sql: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];

    // Add search conditions
    if (searchQuery?.trim() && searchFields?.length) {
      const searchConditions = searchFields
        .map((field) => `${field} LIKE ?`)
        .join(" OR ");
      clauses.push(`(${searchConditions})`);
      const searchPattern = `%${searchQuery.trim()}%`;
      searchFields.forEach(() => params.push(searchPattern));
    }

    // Add filter conditions
    for (const condition of conditions) {
      clauses.push(`${condition.field} ${condition.operator} ?`);
      params.push(condition.value);
    }

    return {
      sql: clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "",
      params,
    };
  }

  // Helper method for building ORDER BY clause safely
  protected buildOrderClause(
    sortField?: string,
    sortDirection?: "asc" | "desc",
    validFields: string[] = [],
    defaultSort: string = "id ASC"
  ): string {
    if (!sortField || !validFields.includes(sortField)) {
      return ` ORDER BY ${defaultSort}`;
    }

    const direction = sortDirection?.toLowerCase() === "desc" ? "DESC" : "ASC";
    return ` ORDER BY ${sortField} ${direction}`;
  }

  // Helper method for pagination
  protected buildPaginationClause(
    page?: number,
    pageSize?: number
  ): {
    sql: string;
    params: any[];
  } {
    if (page == null || pageSize == null || pageSize <= 0) {
      return { sql: "", params: [] };
    }

    const offset = page * pageSize;
    return {
      sql: " LIMIT ? OFFSET ?",
      params: [pageSize, offset],
    };
  }
}
