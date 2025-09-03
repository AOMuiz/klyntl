import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseConfig } from "../service";
import { AuditLogService } from "../service/AuditLogService";
import { QueryBuilderService } from "../service/QueryBuilderService";
import {
  DatabaseError,
  DuplicateError,
  NotFoundError,
  ValidationError,
} from "../service/utilService";
import { ValidationService } from "../service/ValidationService";

// ===== CUSTOMER REPOSITORY =====
export class CustomerRepository {
  constructor(
    private db: SQLiteDatabase,
    private config: DatabaseConfig,
    private auditService: AuditLogService,
    private queryBuilder: QueryBuilderService
  ) {}

  async create(customerData: CreateCustomerInput): Promise<Customer> {
    ValidationService.validateCustomerInput(customerData);

    try {
      const id = generateId("cust");
      const now = new Date().toISOString();

      const customer: Customer = {
        id,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || undefined,
        address: customerData.address || undefined,
        company: customerData.company || undefined,
        jobTitle: customerData.jobTitle || undefined,
        birthday: customerData.birthday
          ? new Date(customerData.birthday).toISOString()
          : undefined,
        notes: customerData.notes || undefined,
        nickname: customerData.nickname || undefined,
        photoUri: customerData.photoUri || undefined,
        contactSource: customerData.contactSource || "manual",
        lastContactDate: undefined,
        preferredContactMethod:
          customerData.preferredContactMethod || undefined,
        totalSpent: 0,
        lastPurchase: undefined,
        createdAt: now,
        updatedAt: now,
        customerType:
          customerData.company && customerData.company.trim()
            ? "business"
            : "individual",
        isActive: false,
      };

      try {
        await this.db.runAsync(
          `INSERT INTO customers (
            id, name, phone, email, address, company, jobTitle, birthday, 
            notes, nickname, photoUri, contactSource, lastContactDate, 
            preferredContactMethod, totalSpent, lastPurchase, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customer.id,
            customer.name,
            customer.phone,
            customer.email ?? null,
            customer.address ?? null,
            customer.company ?? null,
            customer.jobTitle ?? null,
            customer.birthday ?? null,
            customer.notes ?? null,
            customer.nickname ?? null,
            customer.photoUri ?? null,
            customer.contactSource || "manual",
            customer.lastContactDate ?? null,
            customer.preferredContactMethod ?? null,
            customer.totalSpent,
            customer.lastPurchase ?? null,
            customer.createdAt,
            customer.updatedAt,
          ]
        );
      } catch (dbError: any) {
        if (dbError?.message?.includes("UNIQUE") || dbError?.code === 2067) {
          throw new DuplicateError("phone", customerData.phone);
        }
        throw dbError;
      }

      await this.auditService.logEntry({
        tableName: "customers",
        operation: "CREATE",
        recordId: customer.id,
        newValues: customer,
      });

      return customer;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DuplicateError) {
        throw error;
      }
      throw new DatabaseError("createCustomer", error as Error);
    }
  }

  async findWithFilters(
    searchQuery?: string,
    filters?: CustomerFilters,
    sort?: SortOptions,
    page: number = 0,
    pageSize: number = this.config.defaultPageSize
  ): Promise<Customer[]> {
    try {
      let sql = "SELECT * FROM customers";
      const params: any[] = [];
      const conditions: string[] = [];

      if (searchQuery?.trim()) {
        conditions.push(
          "(name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?)"
        );
        const searchPattern = `%${searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (filters) {
        const { whereClause, params: filterParams } =
          this.queryBuilder.buildCustomerFilterQuery(filters);
        if (whereClause) {
          const filterConditions = whereClause.replace("WHERE ", "");
          conditions.push(`(${filterConditions})`);
          params.push(...filterParams);
        }
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      const validSortFields = [
        "name",
        "totalSpent",
        "createdAt",
        "lastPurchase",
        "lastContactDate",
      ];
      sql += ` ${this.queryBuilder.buildSortClause(sort, validSortFields)}`;

      if (pageSize > 0) {
        const offset = page * pageSize;
        sql += ` LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);
      }

      const results = await this.db.getAllAsync<any>(sql, params);
      return results.map((result) => this.augmentCustomerData(result));
    } catch (error) {
      throw new DatabaseError("findWithFilters", error as Error);
    }
  }

  // Convenience method for simple customer searches
  async findAll(searchQuery?: string): Promise<Customer[]> {
    return this.findWithFilters(searchQuery);
  }

  async findById(id: string): Promise<Customer | null> {
    if (!id?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM customers WHERE id = ?",
        [id]
      );
      return result ? this.augmentCustomerData(result) : null;
    } catch (error) {
      throw new DatabaseError("findById", error as Error);
    }
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    if (!phone?.trim()) {
      throw new ValidationError("Phone number is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM customers WHERE phone = ?",
        [phone]
      );
      return result ? this.augmentCustomerData(result) : null;
    } catch (error) {
      throw new DatabaseError("findByPhone", error as Error);
    }
  }

  async update(id: string, updates: UpdateCustomerInput): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    ValidationService.validateCustomerInput(updates);

    try {
      await this.db.withTransactionAsync(async () => {
        const currentCustomer = await this.findById(id);
        if (!currentCustomer) {
          throw new NotFoundError("Customer", id);
        }

        if (updates.phone && updates.phone !== currentCustomer.phone) {
          const existingCustomer = await this.findByPhone(updates.phone);
          if (existingCustomer && existingCustomer.id !== id) {
            throw new DuplicateError("phone", updates.phone);
          }
        }

        const now = new Date().toISOString();
        const fields = Object.keys(updates).filter((key) => key !== "id");

        if (fields.length === 0) return;

        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => (updates as any)[field]);

        await this.db.runAsync(
          `UPDATE customers SET ${setClause}, updatedAt = ? WHERE id = ?`,
          [...values, now, id]
        );

        await this.auditService.logEntry({
          tableName: "customers",
          operation: "UPDATE",
          recordId: id,
          oldValues: currentCustomer,
          newValues: { ...currentCustomer, ...updates, updatedAt: now },
        });
      });
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof DuplicateError
      ) {
        throw error;
      }
      throw new DatabaseError("update", error as Error);
    }
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      const customer = await this.findById(id);
      if (!customer) {
        throw new NotFoundError("Customer", id);
      }

      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          "DELETE FROM transactions WHERE customerId = ?",
          [id]
        );
        await this.db.runAsync("DELETE FROM customers WHERE id = ?", [id]);

        await this.auditService.logEntry({
          tableName: "customers",
          operation: "DELETE",
          recordId: id,
          oldValues: customer,
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("delete", error as Error);
    }
  }

  private augmentCustomerData(customer: any): Customer {
    const activeDays = this.config.customerActiveDays;
    const cutoffDate = new Date(Date.now() - activeDays * 24 * 60 * 60 * 1000);

    return {
      ...customer,
      customerType:
        customer.company && customer.company.trim() ? "business" : "individual",
      isActive: customer.lastPurchase
        ? new Date(customer.lastPurchase) > cutoffDate
        : false,
    };
  }

  async updateTotals(customerIds: string[]): Promise<void> {
    if (customerIds.length === 0) return;

    try {
      const batchSize = this.config.maxBatchSize;
      for (let i = 0; i < customerIds.length; i += batchSize) {
        const batch = customerIds.slice(i, i + batchSize);
        const placeholders = batch.map(() => "?").join(",");

        const totals = await this.db.getAllAsync<{
          customerId: string;
          totalSpent: number;
          lastPurchase: string;
        }>(
          `SELECT customerId, COALESCE(SUM(amount), 0) as totalSpent, MAX(date) as lastPurchase
           FROM transactions WHERE customerId IN (${placeholders}) AND type = 'sale'
           GROUP BY customerId`,
          batch
        );

        for (const total of totals) {
          await this.db.runAsync(
            `UPDATE customers SET totalSpent = ?, lastPurchase = ?, updatedAt = ? WHERE id = ?`,
            [
              total.totalSpent || 0,
              total.lastPurchase || null,
              new Date().toISOString(),
              total.customerId,
            ]
          );
        }
      }
    } catch (error) {
      throw new DatabaseError("updateTotals", error as Error);
    }
  }
}
