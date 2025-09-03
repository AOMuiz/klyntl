import { CreateCategoryInput, ProductCategory } from "@/types/product";
import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseConfig } from "../service";
import { AuditLogService } from "../service/AuditLogService";
import { DatabaseError, ValidationError } from "../service/utilService";

// ===== PRODUCT CATEGORY REPOSITORY =====
export class ProductCategoryRepository {
  constructor(
    private db: SQLiteDatabase,
    private config: DatabaseConfig,
    private auditService: AuditLogService
  ) {}

  async create(categoryData: CreateCategoryInput): Promise<ProductCategory> {
    if (!categoryData.name?.trim()) {
      throw new ValidationError("Category name is required", "name");
    }

    try {
      const id = generateId("cat");
      const now = new Date().toISOString();

      const category: ProductCategory = {
        id,
        name: categoryData.name,
        description: categoryData.description,
        parentId: categoryData.parentId,
        isActive: true,
        createdAt: now,
      };

      await this.db.runAsync(
        `INSERT INTO product_categories (id, name, description, parentId, isActive, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.description || null,
          category.parentId || null,
          category.isActive ? 1 : 0,
          category.createdAt,
        ]
      );

      await this.auditService.logEntry({
        tableName: "product_categories",
        operation: "CREATE",
        recordId: category.id,
        newValues: category,
      });

      return category;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("create", error as Error);
    }
  }

  async findAll(): Promise<ProductCategory[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        "SELECT * FROM product_categories WHERE isActive = 1 ORDER BY name ASC"
      );

      return results.map((result) => ({
        ...result,
        isActive: result.isActive === 1,
      }));
    } catch (error) {
      throw new DatabaseError("findAll", error as Error);
    }
  }

  async findById(id: string): Promise<ProductCategory | null> {
    if (!id?.trim()) {
      throw new ValidationError("Category ID is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM product_categories WHERE id = ?",
        [id]
      );

      if (!result) return null;

      return {
        ...result,
        isActive: result.isActive === 1,
      };
    } catch (error) {
      throw new DatabaseError("findById", error as Error);
    }
  }
}
