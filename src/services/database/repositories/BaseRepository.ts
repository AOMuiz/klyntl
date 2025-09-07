import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogService } from "../service/AuditLogService";
import { DatabaseConfig } from "../types";
import {
  IBaseRepository,
  IPaginatedRepository,
} from "./interfaces/IBaseRepository";
import {
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryValidationError,
} from "./interfaces/errors";

// ===== BASE REPOSITORY ABSTRACT CLASS =====
// Provides common CRUD functionality for all repositories
// Implements the Template Method pattern for database operations

export abstract class BaseRepository<T, TId extends string | number = string>
  implements IBaseRepository<T, TId>, IPaginatedRepository<T>
{
  protected readonly db: SQLiteDatabase;
  protected readonly config: DatabaseConfig;
  protected readonly auditService: AuditLogService;
  protected readonly tableName: string;
  protected readonly entityName: string;

  constructor(
    db: SQLiteDatabase,
    config: DatabaseConfig,
    auditService: AuditLogService,
    tableName: string,
    entityName: string
  ) {
    this.db = db;
    this.config = config;
    this.auditService = auditService;
    this.tableName = tableName;
    this.entityName = entityName;
  }

  // ===== CORE CRUD OPERATIONS =====

  async findById(id: TId): Promise<T | null> {
    try {
      this.validateId(id);

      const result = await this.db.getFirstAsync<T>(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      return result ? this.augmentEntity(result) : null;
    } catch (error) {
      throw new RepositoryError(
        this.entityName,
        "findById",
        `Failed to find ${this.entityName} by ID`,
        error as Error
      );
    }
  }

  async findAll(searchQuery?: string): Promise<T[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];

      if (searchQuery?.trim()) {
        const { condition, searchParams } =
          this.buildSearchCondition(searchQuery);
        sql += ` WHERE ${condition}`;
        params.push(...searchParams);
      }

      sql += ` ORDER BY ${this.getDefaultSortField()} ${this.getDefaultSortDirection()}`;

      const results = await this.db.getAllAsync<T>(sql, params);
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        this.entityName,
        "findAll",
        `Failed to find all ${this.entityName}s`,
        error as Error
      );
    }
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    try {
      // Validate input data
      await this.validateCreateData(data);

      // Generate ID and timestamps
      const id = this.generateEntityId();
      const now = new Date().toISOString();
      const entity = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      } as T;

      // Build insert query
      const { columns, values, placeholders } = this.buildInsertQuery(entity);

      await this.db.runAsync(
        `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
        values
      );

      // Log audit entry
      await this.auditService.logEntry({
        tableName: this.tableName,
        operation: "CREATE",
        recordId: id as string,
        newValues: entity as Record<string, any>,
      });

      return this.augmentEntity(entity);
    } catch (error) {
      if (error instanceof RepositoryValidationError) {
        throw error;
      }
      throw new RepositoryError(
        this.entityName,
        "create",
        `Failed to create ${this.entityName}`,
        error as Error
      );
    }
  }

  async update(id: TId, data: Partial<T>): Promise<void> {
    try {
      this.validateId(id);
      await this.validateUpdateData(data);

      // Check if entity exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new RepositoryNotFoundError(this.entityName, id as string);
      }

      // Build update query
      const { setClause, values } = this.buildUpdateQuery(data);
      if (setClause) {
        values.push(new Date().toISOString()); // updatedAt
        values.push(id);

        await this.db.runAsync(
          `UPDATE ${this.tableName} SET ${setClause}, updatedAt = ? WHERE id = ?`,
          values
        );

        // Log audit entry
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        await this.auditService.logEntry({
          tableName: this.tableName,
          operation: "UPDATE",
          recordId: id as string,
          oldValues: existing as Record<string, any>,
          newValues: updated as Record<string, any>,
        });
      }
    } catch (error) {
      if (
        error instanceof RepositoryNotFoundError ||
        error instanceof RepositoryValidationError
      ) {
        throw error;
      }
      throw new RepositoryError(
        this.entityName,
        "update",
        `Failed to update ${this.entityName}`,
        error as Error
      );
    }
  }

  async delete(id: TId): Promise<void> {
    try {
      this.validateId(id);

      // Check if entity exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new RepositoryNotFoundError(this.entityName, id as string);
      }

      await this.db.runAsync(`DELETE FROM ${this.tableName} WHERE id = ?`, [
        id,
      ]);

      // Log audit entry
      await this.auditService.logEntry({
        tableName: this.tableName,
        operation: "DELETE",
        recordId: id as string,
        oldValues: existing as Record<string, any>,
      });
    } catch (error) {
      if (error instanceof RepositoryNotFoundError) {
        throw error;
      }
      throw new RepositoryError(
        this.entityName,
        "delete",
        `Failed to delete ${this.entityName}`,
        error as Error
      );
    }
  }

  async exists(id: TId): Promise<boolean> {
    try {
      this.validateId(id);

      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      throw new RepositoryError(
        this.entityName,
        "exists",
        `Failed to check if ${this.entityName} exists`,
        error as Error
      );
    }
  }

  async count(searchQuery?: string): Promise<number> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params: any[] = [];

      if (searchQuery?.trim()) {
        const { condition, searchParams } =
          this.buildSearchCondition(searchQuery);
        sql += ` WHERE ${condition}`;
        params.push(...searchParams);
      }

      const result = await this.db.getFirstAsync<{ count: number }>(
        sql,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new RepositoryError(
        this.entityName,
        "count",
        `Failed to count ${this.entityName}s`,
        error as Error
      );
    }
  }

  // ===== PAGINATION SUPPORT =====

  async findWithPagination(
    searchQuery?: string,
    page: number = 0,
    pageSize: number = this.config.defaultPageSize
  ): Promise<{
    items: T[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    try {
      const totalCount = await this.count(searchQuery);
      const totalPages = Math.ceil(totalCount / pageSize);
      const offset = page * pageSize;

      let sql = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];

      if (searchQuery?.trim()) {
        const { condition, searchParams } =
          this.buildSearchCondition(searchQuery);
        sql += ` WHERE ${condition}`;
        params.push(...searchParams);
      }

      sql += ` ORDER BY ${this.getDefaultSortField()} ${this.getDefaultSortDirection()}`;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);

      const results = await this.db.getAllAsync<T>(sql, params);
      const items = results.map((result) => this.augmentEntity(result));

      return {
        items,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages - 1,
        hasPreviousPage: page > 0,
      };
    } catch (error) {
      throw new RepositoryError(
        this.entityName,
        "findWithPagination",
        `Failed to find ${this.entityName}s with pagination`,
        error as Error
      );
    }
  }

  // ===== PROTECTED HELPER METHODS =====

  protected validateId(id: TId): void {
    if (!id || (typeof id === "string" && !id.trim())) {
      throw new RepositoryValidationError(
        this.entityName,
        "validateId",
        "id",
        "ID is required and cannot be empty"
      );
    }
  }

  protected generateEntityId(): string {
    // Special-case customers to use shorter 'cust' prefix instead of 'customer'
    const base = this.tableName.replace(/s$/, ""); // Remove plural 's'
    if (base === "customer") {
      return generateId("cust");
    }

    return generateId(base);
  }

  protected buildSearchCondition(searchQuery: string): {
    condition: string;
    searchParams: any[];
  } {
    const searchFields = this.getSearchFields();
    const conditions = searchFields
      .map((field) => `${field} LIKE ?`)
      .join(" OR ");
    const searchPattern = `%${searchQuery.trim()}%`;
    const searchParams = searchFields.map(() => searchPattern);

    return {
      condition: `(${conditions})`,
      searchParams,
    };
  }

  protected buildInsertQuery(entity: T): {
    columns: string;
    values: any[];
    placeholders: string;
  } {
    const entries = Object.entries(entity as Record<string, any>).filter(
      ([_, value]) => value !== undefined
    );

    const columns = entries.map(([key]) => key).join(", ");
    const values = entries.map(([_, value]) => value);
    const placeholders = entries.map(() => "?").join(", ");

    return { columns, values, placeholders };
  }

  protected buildUpdateQuery(data: Partial<T>): {
    setClause: string;
    values: any[];
  } {
    const entries = Object.entries(data as Record<string, any>).filter(
      ([key, value]) => key !== "id" && value !== undefined
    );

    if (entries.length === 0) {
      return { setClause: "", values: [] };
    }

    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([_, value]) => value);

    return { setClause, values };
  }

  // ===== ABSTRACT METHODS (TO BE IMPLEMENTED BY SUBCLASSES) =====

  protected abstract getSearchFields(): string[];
  protected abstract getDefaultSortField(): string;
  protected abstract getDefaultSortDirection(): "ASC" | "DESC";
  protected abstract validateCreateData(
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ): Promise<void>;
  protected abstract validateUpdateData(data: Partial<T>): Promise<void>;
  protected abstract augmentEntity(entity: T): T;
}
