import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
import { randomUUID } from "expo-crypto";
import { SQLiteDatabase } from "expo-sqlite";
import {
  DatabaseError,
  DuplicateError,
  NotFoundError,
  ValidationError,
} from "../../service/utilService";
import { ValidationService } from "../../service/ValidationService";
import { ICustomerRepository } from "../interfaces/ICustomerRepository";
import { IValidationService } from "../interfaces/IValidationService";
import { BaseRepository } from "./BaseRepository";

export class CustomerRepository
  extends BaseRepository<Customer>
  implements ICustomerRepository
{
  private validationService: IValidationService;

  constructor(db: SQLiteDatabase, config?: any) {
    super(db, "customers", config);
    this.validationService = new ValidationService(db);
  }

  protected mapToEntity(record: any): Customer {
    return {
      id: record.id,
      name: record.name,
      phone: record.phone,
      email: record.email || undefined,
      address: record.address || undefined,
      totalSpent: record.totalSpent || 0,
      lastPurchase: record.lastPurchase || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      company: record.company || undefined,
      jobTitle: record.jobTitle || undefined,
      birthday: record.birthday || undefined,
      notes: record.notes || undefined,
      nickname: record.nickname || undefined,
      photoUri: record.photoUri || undefined,
      contactSource: record.contactSource || "manual",
      lastContactDate: record.lastContactDate || undefined,
      preferredContactMethod: record.preferredContactMethod || undefined,
      // Computed properties
      customerType:
        record.company && record.company.trim() ? "business" : "individual",
      isActive: this.isCustomerActive(record.lastPurchase),
    };
  }

  private isCustomerActive(lastPurchase?: string): boolean {
    if (!lastPurchase) return false;
    const activeDays = 60; // Could come from config
    const cutoffDate = new Date(Date.now() - activeDays * 24 * 60 * 60 * 1000);
    return new Date(lastPurchase) > cutoffDate;
  }

  protected generateId(): string {
    return `cust_${randomUUID()}`;
  }

  protected async validateCreateData(
    entity: Omit<Customer, "id">
  ): Promise<void> {
    await this.validationService.validateCustomer(
      entity as CreateCustomerInput
    );
  }

  protected async validateUpdateData(
    id: string,
    entity: Partial<Customer>
  ): Promise<void> {
    // No need to check for phone uniqueness here; rely on DB constraint
    await this.validationService.validateCustomer(
      entity as UpdateCustomerInput
    );
  }

  protected getCreateQuery(): string {
    return `
      INSERT INTO customers (
        id, name, phone, email, address, totalSpent, lastPurchase,
        createdAt, updatedAt, company, jobTitle, birthday, notes,
        nickname, photoUri, contactSource, lastContactDate, preferredContactMethod
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  }

  protected getUpdateQuery(): string {
    return `
      UPDATE customers SET
        name = ?, phone = ?, email = ?, address = ?, totalSpent = ?,
        lastPurchase = ?, updatedAt = ?, company = ?, jobTitle = ?,
        birthday = ?, notes = ?, nickname = ?, photoUri = ?,
        contactSource = ?, lastContactDate = ?, preferredContactMethod = ?
      WHERE id = ?
    `;
  }

  protected getCreateParams(customer: Omit<Customer, "id">): any[] {
    const now = new Date().toISOString();
    const id = this.generateId();

    return [
      id,
      customer.name,
      customer.phone,
      customer.email ?? null,
      customer.address ?? null,
      customer.totalSpent || 0,
      customer.lastPurchase ?? null,
      now,
      now,
      customer.company ?? null,
      customer.jobTitle ?? null,
      customer.birthday ?? null,
      customer.notes ?? null,
      customer.nickname ?? null,
      customer.photoUri ?? null,
      customer.contactSource || "manual",
      customer.lastContactDate ?? null,
      customer.preferredContactMethod ?? null,
    ];
  }

  protected getUpdateParams(customer: Partial<Customer>): any[] {
    return [
      customer.name,
      customer.phone,
      customer.email ?? null,
      customer.address ?? null,
      customer.totalSpent,
      customer.lastPurchase ?? null,
      new Date().toISOString(),
      customer.company ?? null,
      customer.jobTitle ?? null,
      customer.birthday ?? null,
      customer.notes ?? null,
      customer.nickname ?? null,
      customer.photoUri ?? null,
      customer.contactSource,
      customer.lastContactDate ?? null,
      customer.preferredContactMethod ?? null,
    ];
  }

  // Existing methods
  async findByPhone(phone: string): Promise<Customer | null> {
    if (!phone?.trim()) {
      throw new ValidationError("Phone number is required", "phone");
    }

    try {
      const query = "SELECT * FROM customers WHERE phone = ? LIMIT 1";
      const result = await this.db.getFirstAsync(query, [phone]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new DatabaseError("findByPhone", error as Error);
    }
  }

  async findWithFilters(
    searchQuery?: string,
    filters?: CustomerFilters,
    sort?: SortOptions,
    page: number = 0,
    pageSize: number = 20
  ): Promise<Customer[]> {
    try {
      const { sql: whereClause, params } = this.buildCustomerFilters(
        searchQuery,
        filters
      );
      const orderClause = this.buildOrderClause(
        sort?.field,
        sort?.direction,
        ["name", "totalSpent", "createdAt", "lastPurchase", "lastContactDate"],
        "name ASC"
      );
      const { sql: paginationClause, params: paginationParams } =
        this.buildPaginationClause(page, pageSize);

      const query = `SELECT * FROM customers${whereClause}${orderClause}${paginationClause}`;
      const results = await this.db.getAllAsync(query, [
        ...params,
        ...paginationParams,
      ]);

      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("findWithFilters", error as Error);
    }
  }

  async getCount(
    searchQuery?: string,
    filters?: CustomerFilters
  ): Promise<number> {
    try {
      const { sql: whereClause, params } = this.buildCustomerFilters(
        searchQuery,
        filters
      );
      const query = `SELECT COUNT(*) as count FROM customers${whereClause}`;

      const result = await this.db.getFirstAsync<{ count: number }>(
        query,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new DatabaseError("getCount", error as Error);
    }
  }

  async updateTotals(customerIds: string[]): Promise<void> {
    if (customerIds.length === 0) return;

    try {
      const placeholders = customerIds.map(() => "?").join(",");
      const query = `
        UPDATE customers 
        SET 
          totalSpent = (
            SELECT COALESCE(SUM(
              CASE 
                WHEN type = 'sale' THEN amount 
                WHEN type = 'refund' THEN -amount
                ELSE 0 
              END
            ), 0)
            FROM transactions
            WHERE customerId = customers.id
          ),
          lastPurchase = (
            SELECT MAX(date)
            FROM transactions
            WHERE customerId = customers.id AND type = 'sale'
          ),
          updatedAt = ?
        WHERE id IN (${placeholders})
      `;

      await this.db.runAsync(query, [new Date().toISOString(), ...customerIds]);
    } catch (error) {
      throw new DatabaseError("updateTotals", error as Error);
    }
  }

  // New validation methods
  async validateCreate(data: CreateCustomerInput): Promise<void> {
    await this.validationService.validateCustomer(data);
  }

  async validateUpdate(id: string, data: UpdateCustomerInput): Promise<void> {
    if (!(await this.exists(id))) {
      throw new NotFoundError("Customer", id);
    }
    await this.validateUpdateData(id, data as Partial<Customer>);
  }

  async createWithValidation(data: CreateCustomerInput): Promise<Customer> {
    await this.validateCreate(data);
    try {
      return await this.create(data as Omit<Customer, "id">);
    } catch (error: any) {
      if (
        error?.message?.includes("UNIQUE constraint failed: customers.phone")
      ) {
        throw new DuplicateError("phone", (data as any).phone);
      }
      throw error;
    }
  }

  async updateWithValidation(
    id: string,
    data: UpdateCustomerInput
  ): Promise<void> {
    await this.validateUpdate(id, data);
    try {
      return await this.update(id, data as Partial<Customer>);
    } catch (error: any) {
      if (
        error?.message?.includes("UNIQUE constraint failed: customers.phone")
      ) {
        throw new DuplicateError("phone", (data as any).phone);
      }
      throw error;
    }
  }

  // New enhanced query methods
  async findActiveCustomers(activeDays: number = 60): Promise<Customer[]> {
    try {
      const cutoffDate = new Date(
        Date.now() - activeDays * 24 * 60 * 60 * 1000
      ).toISOString();
      const query =
        "SELECT * FROM customers WHERE lastPurchase >= ? ORDER BY lastPurchase DESC";

      const results = await this.db.getAllAsync(query, [cutoffDate]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("findActiveCustomers", error as Error);
    }
  }

  async findInactiveCustomers(activeDays: number = 60): Promise<Customer[]> {
    try {
      const cutoffDate = new Date(
        Date.now() - activeDays * 24 * 60 * 60 * 1000
      ).toISOString();
      const query = `
        SELECT * FROM customers 
        WHERE lastPurchase IS NULL OR lastPurchase < ? 
        ORDER BY COALESCE(lastPurchase, createdAt) DESC
      `;

      const results = await this.db.getAllAsync(query, [cutoffDate]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("findInactiveCustomers", error as Error);
    }
  }

  async findByCompany(company: string): Promise<Customer[]> {
    if (!company?.trim()) {
      throw new ValidationError("Company name is required", "company");
    }

    try {
      const query =
        "SELECT * FROM customers WHERE company = ? ORDER BY name ASC";
      const results = await this.db.getAllAsync(query, [company]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("findByCompany", error as Error);
    }
  }

  async searchCustomers(
    searchQuery: string,
    limit: number = 50
  ): Promise<Customer[]> {
    if (!searchQuery?.trim()) {
      return [];
    }

    try {
      const searchPattern = `%${searchQuery.trim()}%`;
      const query = `
        SELECT * FROM customers 
        WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?
        ORDER BY 
          CASE 
            WHEN name LIKE ? THEN 1
            WHEN phone LIKE ? THEN 2
            WHEN email LIKE ? THEN 3
            ELSE 4
          END,
          totalSpent DESC
        LIMIT ?
      `;

      const results = await this.db.getAllAsync(query, [
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        `${searchQuery.trim()}%`,
        `${searchQuery.trim()}%`,
        `${searchQuery.trim()}%`,
        limit,
      ]);

      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("searchCustomers", error as Error);
    }
  }

  // New business logic methods
  async markAsContacted(id: string, contactDate?: Date): Promise<void> {
    try {
      const date = contactDate || new Date().toISOString();
      await this.update(id, {
        lastContactDate: date,
        updatedAt: new Date().toISOString(),
      } as Partial<Customer>);
    } catch (error) {
      throw new DatabaseError("markAsContacted", error as Error);
    }
  }

  async getCustomerStats(id: string): Promise<{
    totalTransactions: number;
    totalSpent: number;
    averageTransaction: number;
    firstPurchase?: string;
    lastPurchase?: string;
  }> {
    try {
      const result = await this.db.getFirstAsync<{
        totalTransactions: number;
        totalSpent: number;
        firstPurchase: string;
        lastPurchase: string;
      }>(
        `SELECT 
          COUNT(*) as totalTransactions,
          COALESCE(SUM(
            CASE 
              WHEN type = 'sale' THEN amount 
              WHEN type = 'refund' THEN -amount
              ELSE 0 
            END
          ), 0) as totalSpent,
          MIN(date) as firstPurchase,
          MAX(CASE WHEN type = 'sale' THEN date END) as lastPurchase
         FROM transactions 
         WHERE customerId = ?`,
        [id]
      );

      return {
        totalTransactions: result?.totalTransactions || 0,
        totalSpent: result?.totalSpent || 0,
        averageTransaction: result?.totalTransactions
          ? (result.totalSpent || 0) / result.totalTransactions
          : 0,
        firstPurchase: result?.firstPurchase,
        lastPurchase: result?.lastPurchase,
      };
    } catch (error) {
      throw new DatabaseError("getCustomerStats", error as Error);
    }
  }

  // Helper method to build customer filters
  private buildCustomerFilters(
    searchQuery?: string,
    filters?: CustomerFilters
  ): { sql: string; params: any[] } {
    const conditions: { field: string; operator: string; value: any }[] = [];

    if (filters) {
      if (filters.spendingRange?.min !== undefined) {
        conditions.push({
          field: "totalSpent",
          operator: ">=",
          value: filters.spendingRange.min,
        });
      }
      if (filters.spendingRange?.max !== undefined) {
        conditions.push({
          field: "totalSpent",
          operator: "<=",
          value: filters.spendingRange.max,
        });
      }

      if (filters.customerType && filters.customerType !== "all") {
        if (filters.customerType === "business") {
          conditions.push({
            field: "company",
            operator: "IS NOT NULL",
            // value: "",
            value: null,
          });
        } else {
          // conditions.push({ field: "company", operator: "IS NULL", value: "" });
          conditions.push({
            field: "company",
            operator: "IS NULL",
            value: null,
          });
        }
      }

      if (filters.dateRange) {
        conditions.push({
          field: "createdAt",
          operator: ">=",
          value: filters.dateRange.startDate,
        });
        conditions.push({
          field: "createdAt",
          operator: "<=",
          value: filters.dateRange.endDate,
        });
      }

      if (filters.contactSource && filters.contactSource !== "all") {
        conditions.push({
          field: "contactSource",
          operator: "=",
          value: filters.contactSource,
        });
      }

      if (
        filters.preferredContactMethod &&
        filters.preferredContactMethod !== "all"
      ) {
        conditions.push({
          field: "preferredContactMethod",
          operator: "=",
          value: filters.preferredContactMethod,
        });
      }

      if (filters.isActive !== undefined) {
        const activeDays = 60;
        const cutoffDate = new Date(
          Date.now() - activeDays * 24 * 60 * 60 * 1000
        ).toISOString();
        if (filters.isActive) {
          conditions.push({
            field: "lastPurchase",
            operator: ">=",
            value: cutoffDate,
          });
        } else {
          conditions.push({
            field: "lastPurchase",
            operator: "<",
            value: cutoffDate,
          });
        }
      }
    }

    return this.buildWhereClause(
      conditions,
      ["name", "phone", "email", "company"],
      searchQuery
    );
  }
}
