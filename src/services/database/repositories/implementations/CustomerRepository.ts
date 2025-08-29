import { Customer } from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
// import * as Crypto from "expo-crypto";
import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseError } from "../../service";
import { ICustomerRepository } from "../interfaces/ICustomerRepository";
import { BaseRepository } from "./BaseRepository";

export class CustomerRepository
  extends BaseRepository<Customer>
  implements ICustomerRepository
{
  constructor(db: SQLiteDatabase) {
    super(db, "customers");
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
    };
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
    const id = crypto.randomUUID();

    return [
      id,
      customer.name,
      customer.phone,
      customer.email,
      customer.address,
      customer.totalSpent || 0,
      customer.lastPurchase || null,
      now,
      now,
      customer.company,
      customer.jobTitle,
      customer.birthday || null,
      customer.notes,
      customer.nickname,
      customer.photoUri,
      customer.contactSource || "manual",
      customer.lastContactDate || null,
      customer.preferredContactMethod,
    ];
  }

  protected getUpdateParams(customer: Partial<Customer>): any[] {
    return [
      customer.name,
      customer.phone,
      customer.email,
      customer.address,
      customer.totalSpent,
      customer.lastPurchase || null,
      new Date().toISOString(),
      customer.company,
      customer.jobTitle,
      customer.birthday || null,
      customer.notes,
      customer.nickname,
      customer.photoUri,
      customer.contactSource,
      customer.lastContactDate || null,
      customer.preferredContactMethod,
    ];
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    try {
      const query = "SELECT * FROM customers WHERE phone = ? LIMIT 1";
      const result = await this.db.getFirstAsync(query, [phone]);

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new DatabaseError(
        "findByPhone",
        error instanceof Error ? error : new Error(String(error))
      );
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
      let query = "SELECT * FROM customers WHERE 1=1";
      const params: any[] = [];

      if (searchQuery) {
        query += " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)";
        const searchPattern = `%${searchQuery}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (filters) {
        // Add filter conditions based on CustomerFilters
        if (filters.spendingRange?.min !== undefined) {
          query += " AND totalSpent >= ?";
          params.push(filters.spendingRange.min);
        }
        if (filters.spendingRange?.max !== undefined) {
          query += " AND totalSpent <= ?";
          params.push(filters.spendingRange.max);
        }
        if (filters.customerType && filters.customerType !== "all") {
          query +=
            " AND company IS " +
            (filters.customerType === "business" ? "NOT NULL" : "NULL");
        }
        if (filters.dateRange) {
          query += " AND createdAt >= ? AND createdAt <= ?";
          params.push(filters.dateRange.startDate, filters.dateRange.endDate);
        }
        if (filters.contactSource && filters.contactSource !== "all") {
          query += " AND contactSource = ?";
          params.push(filters.contactSource);
        }
        if (
          filters.preferredContactMethod &&
          filters.preferredContactMethod !== "all"
        ) {
          query += " AND preferredContactMethod = ?";
          params.push(filters.preferredContactMethod);
        }
        if (filters.isActive !== undefined) {
          // Consider a customer active if they have made a purchase in the last 60 days
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          query +=
            " AND lastPurchase " + (filters.isActive ? ">=" : "<") + " ?";
          params.push(sixtyDaysAgo.toISOString());
        }
      }

      if (sort) {
        const direction = sort.direction === "desc" ? "DESC" : "ASC";
        query += ` ORDER BY ${sort.field} ${direction}`;
      }

      query += " LIMIT ? OFFSET ?";
      params.push(pageSize, page * pageSize);

      const results = await this.db.getAllAsync(query, params);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError(
        "findWithFilters",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getCount(
    searchQuery?: string,
    filters?: CustomerFilters
  ): Promise<number> {
    try {
      let query = "SELECT COUNT(*) as count FROM customers WHERE 1=1";
      const params: any[] = [];

      if (searchQuery) {
        query += " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)";
        const searchPattern = `%${searchQuery}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (filters) {
        if (filters.spendingRange?.min !== undefined) {
          query += " AND totalSpent >= ?";
          params.push(filters.spendingRange.min);
        }
        if (filters.spendingRange?.max !== undefined) {
          query += " AND totalSpent <= ?";
          params.push(filters.spendingRange.max);
        }
        if (filters.customerType && filters.customerType !== "all") {
          query +=
            " AND company IS " +
            (filters.customerType === "business" ? "NOT NULL" : "NULL");
        }
        if (filters.dateRange) {
          query += " AND createdAt >= ? AND createdAt <= ?";
          params.push(filters.dateRange.startDate, filters.dateRange.endDate);
        }
        if (filters.contactSource && filters.contactSource !== "all") {
          query += " AND contactSource = ?";
          params.push(filters.contactSource);
        }
        if (
          filters.preferredContactMethod &&
          filters.preferredContactMethod !== "all"
        ) {
          query += " AND preferredContactMethod = ?";
          params.push(filters.preferredContactMethod);
        }
        if (filters.isActive !== undefined) {
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          query +=
            " AND lastPurchase " + (filters.isActive ? ">=" : "<") + " ?";
          params.push(sixtyDaysAgo.toISOString());
        }
      }

      const result = await this.db.getFirstAsync<{ count: number }>(
        query,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new DatabaseError(
        "getCount",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async updateTotals(customerIds: string[]): Promise<void> {
    try {
      // Update customer totals based on their transactions
      const query = `
        UPDATE customers 
        SET totalSpent = (
          SELECT COALESCE(SUM(amount), 0)
          FROM transactions
          WHERE customerId = customers.id
        ),
        lastPurchase = (
          SELECT MAX(date)
          FROM transactions
          WHERE customerId = customers.id
        )
        WHERE id IN (${customerIds.map(() => "?").join(",")})
      `;

      await this.db.runAsync(query, customerIds);
    } catch (error) {
      throw new DatabaseError(
        "updateTotals",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
