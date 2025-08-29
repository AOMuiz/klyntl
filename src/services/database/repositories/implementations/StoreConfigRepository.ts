import { StoreConfig } from "@/types/store";
// import * as Crypto from "expo-crypto";
import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseError } from "../../service";
import { IStoreConfigRepository } from "../interfaces/IStoreConfigRepository";
import { BaseRepository } from "./BaseRepository";

export class StoreConfigRepository
  extends BaseRepository<StoreConfig>
  implements IStoreConfigRepository
{
  constructor(db: SQLiteDatabase) {
    super(db, "store_config");
  }

  protected mapToEntity(record: any): StoreConfig {
    return {
      id: record.id,
      storeName: record.storeName,
      description: record.description || undefined,
      logoUrl: record.logoUrl || undefined,
      primaryColor: record.primaryColor,
      secondaryColor: record.secondaryColor,
      currency: record.currency,
      isActive: Boolean(record.isActive),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected getCreateQuery(): string {
    return `
      INSERT INTO store_config (
        id, storeName, description, logoUrl, primaryColor,
        secondaryColor, currency, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  }

  protected getUpdateQuery(): string {
    return `
      UPDATE store_config SET
        storeName = ?, description = ?, logoUrl = ?, primaryColor = ?,
        secondaryColor = ?, currency = ?, isActive = ?, updatedAt = ?
      WHERE id = ?
    `;
  }

  protected getCreateParams(config: Omit<StoreConfig, "id">): any[] {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    return [
      id,
      config.storeName,
      config.description || null,
      config.logoUrl || null,
      config.primaryColor,
      config.secondaryColor,
      config.currency,
      config.isActive ? 1 : 0,
      now,
      now,
    ];
  }

  protected getUpdateParams(config: Partial<StoreConfig>): any[] {
    return [
      config.storeName,
      config.description || null,
      config.logoUrl || null,
      config.primaryColor,
      config.secondaryColor,
      config.currency,
      config.isActive !== undefined ? (config.isActive ? 1 : 0) : 1,
      new Date().toISOString(),
    ];
  }

  async getActiveConfig(): Promise<StoreConfig | null> {
    try {
      const query = "SELECT * FROM store_config WHERE isActive = 1 LIMIT 1";
      const result = await this.db.getFirstAsync(query);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new DatabaseError(
        "getActiveConfig",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async updateConfigSettings(
    id: string,
    settings: Partial<StoreConfig>
  ): Promise<void> {
    try {
      const updates = Object.entries(settings)
        .filter(([_, value]) => value !== undefined)
        .map(([key]) => `${key} = ?`)
        .join(", ");

      const values = Object.entries(settings)
        .filter(([_, value]) => value !== undefined)
        .map(([_, value]) => value);

      const query = `
        UPDATE store_config 
        SET ${updates}, updatedAt = ? 
        WHERE id = ?
      `;

      await this.db.runAsync(query, [...values, new Date().toISOString(), id]);
    } catch (error) {
      throw new DatabaseError(
        "updateConfigSettings",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
