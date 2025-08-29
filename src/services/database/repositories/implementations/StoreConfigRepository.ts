// Complete StoreConfigRepository Implementation
import { StoreConfig, UpdateStoreConfigInput } from "@/types/store";
import { randomUUID } from "expo-crypto";
import { SQLiteDatabase } from "expo-sqlite";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../../service/utilService";
import { ValidationService } from "../../service/ValidationService";
import { IStoreConfigRepository } from "../interfaces/IStoreConfigRepository";
import { BaseRepository } from "./BaseRepository";

export class StoreConfigRepository
  extends BaseRepository<StoreConfig>
  implements IStoreConfigRepository
{
  private validationService: ValidationService;

  constructor(db: SQLiteDatabase, config?: any) {
    super(db, "store_config", config);
    this.validationService = new ValidationService(db);
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
      isActive: record.isActive === 1,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected generateId(): string {
    return `config_${randomUUID()}`;
  }

  protected async validateCreateData(
    entity: Omit<StoreConfig, "id">
  ): Promise<void> {
    await this.validationService.validateStoreConfig(entity);
  }

  protected async validateUpdateData(
    id: string,
    entity: Partial<StoreConfig>
  ): Promise<void> {
    await this.validationService.validateStoreConfig(
      entity as UpdateStoreConfigInput
    );
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
    const id = this.generateId();

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

  // Interface-specific methods
  async getActiveConfig(): Promise<StoreConfig | null> {
    try {
      const query = "SELECT * FROM store_config WHERE isActive = 1 LIMIT 1";
      const result = await this.db.getFirstAsync(query);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new DatabaseError("getActiveConfig", error as Error);
    }
  }

  async updateConfigSettings(
    id: string,
    settings: Partial<StoreConfig>
  ): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Store config ID is required", "id");
    }

    // Only allow updates to these columns
    const allowedFields = [
      "storeName",
      "description",
      "logoUrl",
      "primaryColor",
      "secondaryColor",
      "currency",
      "isActive",
    ];
    try {
      await this.db.withTransactionAsync(async () => {
        // Check if config exists
        const existing = await this.findById(id);
        if (!existing) {
          throw new NotFoundError("StoreConfig", id);
        }

        // Validate the settings
        await this.validateUpdateData(id, settings);

        const fields = Object.keys(settings).filter(
          (key) => key !== "id" && allowedFields.includes(key)
        );
        if (fields.length === 0) return;

        // If any field is not allowed, throw error
        const invalidFields = Object.keys(settings).filter(
          (key) => key !== "id" && !allowedFields.includes(key)
        );
        if (invalidFields.length > 0) {
          throw new ValidationError(
            `Invalid field(s) for update: ${invalidFields.join(", ")}`,
            invalidFields[0],
            "invalid_field"
          );
        }

        const setClause = fields.map((field) => `${field} = ?`).join(", ");

        const values = fields.map((field) => {
          const value = (settings as any)[field];
          // Convert boolean to integer for SQLite
          if (field === "isActive" && typeof value === "boolean") {
            return value ? 1 : 0;
          }
          return value ?? null;
        });

        await this.db.runAsync(
          `UPDATE store_config SET ${setClause}, updatedAt = ? WHERE id = ?`,
          [...values, new Date().toISOString(), id]
        );

        await this.logAudit("UPDATE", id, existing, {
          ...existing,
          ...settings,
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("updateConfigSettings", error as Error);
    }
  }

  // New validation methods
  async validateCreate(data: Omit<StoreConfig, "id">): Promise<void> {
    await this.validationService.validateStoreConfig(data);
  }

  async validateUpdate(
    id: string,
    data: UpdateStoreConfigInput
  ): Promise<void> {
    if (!(await this.exists(id))) {
      throw new NotFoundError("StoreConfig", id);
    }
    await this.validateUpdateData(id, data as Partial<StoreConfig>);
  }

  async createWithValidation(
    data: Omit<StoreConfig, "id">
  ): Promise<StoreConfig> {
    await this.validateCreate(data);
    return this.create(data);
  }

  async updateWithValidation(
    id: string,
    data: UpdateStoreConfigInput
  ): Promise<void> {
    await this.validateUpdate(id, data);
    return this.update(id, data as Partial<StoreConfig>);
  }

  // Business logic methods
  async initializeDefaultConfig(): Promise<StoreConfig> {
    try {
      // Check if any config exists
      const existing = await this.getActiveConfig();
      if (existing) {
        return existing;
      }

      // Create default configuration
      const defaultConfig: Omit<StoreConfig, "id"> = {
        storeName: "My Store",
        description: "Default store configuration",
        logoUrl: undefined,
        primaryColor: "#3B82F6", // Blue
        secondaryColor: "#1F2937", // Gray
        currency: "NGN",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return await this.createWithValidation(defaultConfig);
    } catch (error) {
      throw new DatabaseError("initializeDefaultConfig", error as Error);
    }
  }

  async deactivateAllConfigs(): Promise<void> {
    try {
      await this.db.runAsync(
        "UPDATE store_config SET isActive = 0, updatedAt = ?",
        [new Date().toISOString()]
      );
    } catch (error) {
      throw new DatabaseError("deactivateAllConfigs", error as Error);
    }
  }

  async activateConfig(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Config ID is required", "id");
    }

    try {
      await this.db.withTransactionAsync(async () => {
        // Check if config exists
        const config = await this.findById(id);
        if (!config) {
          throw new NotFoundError("StoreConfig", id);
        }

        // Deactivate all configs first
        await this.deactivateAllConfigs();

        // Activate the specified config
        await this.db.runAsync(
          "UPDATE store_config SET isActive = 1, updatedAt = ? WHERE id = ?",
          [new Date().toISOString(), id]
        );

        await this.logAudit("UPDATE", id, config, {
          ...config,
          isActive: true,
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("activateConfig", error as Error);
    }
  }

  async getAllConfigs(): Promise<StoreConfig[]> {
    try {
      const results = await this.db.getAllAsync(
        "SELECT * FROM store_config ORDER BY createdAt DESC"
      );
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("getAllConfigs", error as Error);
    }
  }

  async validateConfigIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if there's an active config
      const activeConfig = await this.getActiveConfig();
      if (!activeConfig) {
        errors.push("No active store configuration found");
      } else {
        // Validate required fields
        if (!activeConfig.storeName?.trim()) {
          errors.push("Store name is required");
        }
        if (!activeConfig.currency?.trim()) {
          errors.push("Currency is required");
        }
        if (!activeConfig.primaryColor?.trim()) {
          errors.push("Primary color is required");
        }
        if (!activeConfig.secondaryColor?.trim()) {
          errors.push("Secondary color is required");
        }

        // Check for warnings
        if (!activeConfig.description?.trim()) {
          warnings.push("Store description is not set");
        }
        if (!activeConfig.logoUrl?.trim()) {
          warnings.push("Store logo URL is not set");
        }
      }

      // Check for multiple active configs
      const activeConfigs = await this.db.getAllAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM store_config WHERE isActive = 1"
      );

      if (activeConfigs[0]?.count > 1) {
        errors.push(
          "Multiple active configurations found - only one should be active"
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      throw new DatabaseError("validateConfigIntegrity", error as Error);
    }
  }
}
