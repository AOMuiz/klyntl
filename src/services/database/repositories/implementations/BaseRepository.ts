import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseError, NotFoundError } from "../../service";
import { IBaseRepository } from "../interfaces/IBaseRepository";

export abstract class BaseRepository<T extends { id: string }>
  implements IBaseRepository<T>
{
  protected constructor(
    protected readonly db: SQLiteDatabase,
    protected readonly tableName: string
  ) {}

  protected abstract mapToEntity(record: any): T;
  protected abstract getCreateQuery(): string;
  protected abstract getUpdateQuery(): string;

  async create(entity: Omit<T, "id">): Promise<T> {
    try {
      const query = this.getCreateQuery();
      const result = await this.db.runAsync(
        query,
        this.getCreateParams(entity)
      );

      if (!result.lastInsertRowId) {
        throw new DatabaseError("create", new Error("Failed to create entity"));
      }

      return this.findById(result.lastInsertRowId.toString()) as Promise<T>;
    } catch (error) {
      throw new DatabaseError(
        "create",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async findById(id: string): Promise<T | null> {
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

  async update(id: string, entity: Partial<T>): Promise<void> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundError(this.tableName, id);
      }

      const query = this.getUpdateQuery();
      await this.db.runAsync(query, [...this.getUpdateParams(entity), id]);
    } catch (error) {
      throw new DatabaseError(
        "update",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundError(this.tableName, id);
      }

      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      await this.db.runAsync(query, [id]);
    } catch (error) {
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

  protected abstract getCreateParams(entity: Omit<T, "id">): any[];
  protected abstract getUpdateParams(entity: Partial<T>): any[];
}
