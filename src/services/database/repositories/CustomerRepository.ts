import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogService } from "../service/AuditLogService";
import { QueryBuilderService } from "../service/QueryBuilderService";
import { ValidationService } from "../service/ValidationService";
import { DatabaseConfig } from "../types";
import { BaseRepository } from "./BaseRepository";
import { ICustomerRepository } from "./interfaces/ICustomerRepository";
import {
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryValidationError,
} from "./interfaces/errors";

// ===== CUSTOMER REPOSITORY =====
export class CustomerRepository
  extends BaseRepository<Customer, string>
  implements ICustomerRepository
{
  private queryBuilder: QueryBuilderService;

  constructor(
    db: SQLiteDatabase,
    config: DatabaseConfig,
    auditService: AuditLogService,
    queryBuilder: QueryBuilderService
  ) {
    super(db, config, auditService, "customers", "Customer");
    this.queryBuilder = queryBuilder;
  }

  // ===== IMPLEMENT ABSTRACT METHODS =====

  protected getSearchFields(): string[] {
    return ["name", "phone", "email", "company"];
  }

  protected getDefaultSortField(): string {
    return "name";
  }

  protected getDefaultSortDirection(): "ASC" | "DESC" {
    return "ASC";
  }

  protected async validateCreateData(data: CreateCustomerInput): Promise<void> {
    ValidationService.validateCustomerInput(data);

    // Check for duplicate phone number
    if (data.phone) {
      const existing = await this.findByPhone(data.phone);
      if (existing) {
        throw new RepositoryValidationError(
          "Customer",
          "create",
          "phone",
          `Phone number ${data.phone} is already in use`
        );
      }
    }

    // Check for duplicate email
    if (data.email) {
      const existing = await this.findByEmail(data.email);
      if (existing) {
        throw new RepositoryValidationError(
          "Customer",
          "create",
          "email",
          `Email ${data.email} is already in use`
        );
      }
    }
  }

  protected async validateUpdateData(data: Partial<Customer>): Promise<void> {
    // Extract internal/system fields that don't need validation
    const { totalSpent, lastPurchase, ...userData } = data;

    // Only validate user-editable fields
    if (userData.phone || userData.email || userData.name) {
      ValidationService.validateCustomerInput(userData as CreateCustomerInput);
    }

    // Check for duplicate phone number (excluding current customer)
    if (userData.phone && data.id) {
      const existing = await this.findByPhone(userData.phone);
      if (existing && existing.id !== data.id) {
        throw new RepositoryValidationError(
          "Customer",
          "update",
          "phone",
          `Phone number ${userData.phone} is already in use`
        );
      }
    }

    // Check for duplicate email (excluding current customer)
    if (userData.email && data.id) {
      const existing = await this.findByEmail(userData.email);
      if (existing && existing.id !== data.id) {
        throw new RepositoryValidationError(
          "Customer",
          "update",
          "email",
          `Email ${userData.email} is already in use`
        );
      }
    }
  }

  protected augmentEntity(customer: Customer): Customer {
    // Map snake_case database columns to camelCase properties
    const mappedCustomer = { ...customer };

    // Map credit_balance to creditBalance
    if ("credit_balance" in mappedCustomer) {
      (mappedCustomer as any).creditBalance = (
        mappedCustomer as any
      ).credit_balance;
      delete (mappedCustomer as any).credit_balance;
    }

    return mappedCustomer;
  }

  // ===== CUSTOMER-SPECIFIC METHODS =====

  async findByPhone(phone: string): Promise<Customer | null> {
    try {
      const result = await this.db.getFirstAsync<Customer>(
        "SELECT * FROM customers WHERE phone = ?",
        [phone]
      );
      return result ? this.augmentEntity(result) : null;
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findByPhone",
        "Failed to find customer by phone",
        error as Error
      );
    }
  }

  async findByEmail(email: string): Promise<Customer | null> {
    try {
      const result = await this.db.getFirstAsync<Customer>(
        "SELECT * FROM customers WHERE email = ?",
        [email]
      );
      return result ? this.augmentEntity(result) : null;
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findByEmail",
        "Failed to find customer by email",
        error as Error
      );
    }
  }

  async findRecentCustomers(limit: number = 10): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        "SELECT * FROM customers ORDER BY lastContactDate DESC, createdAt DESC LIMIT ?",
        [limit]
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findRecentCustomers",
        "Failed to find recent customers",
        error as Error
      );
    }
  }

  async findWithFilters(
    filters?: CustomerFilters,
    searchQuery?: string,
    page?: number,
    pageSize?: number,
    sort?: SortOptions
  ): Promise<Customer[]> {
    try {
      const { whereClause, params } =
        this.queryBuilder.buildCustomerFilterQuery(filters || {});

      let sql = `SELECT * FROM customers`;
      if (whereClause) {
        // Remove the "WHERE " prefix since we're adding it here
        const filterConditions = whereClause.replace(/^WHERE\s+/, "");
        sql += ` WHERE ${filterConditions}`;
      }

      // Handle sorting
      if (sort) {
        const sortField = sort.field;
        const sortDirection =
          sort.direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
        sql += ` ORDER BY ${sortField} ${sortDirection}`;
      } else {
        sql += ` ORDER BY name ASC`;
      }

      if (pageSize && page !== undefined) {
        sql += ` LIMIT ? OFFSET ?`;
        params.push(pageSize, page * pageSize);
      }

      const results = await this.db.getAllAsync<Customer>(sql, params);
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findWithFilters",
        "Failed to find customers with filters",
        error as Error
      );
    }
  }

  async getCustomerStats(): Promise<{
    total: number;
    recentlyAdded: number;
    withTransactions: number;
    totalCustomers: number;
    activeCustomers: number;
    businessCustomers: number;
    individualCustomers: number;
    averageSpending: number;
  }> {
    try {
      const total = await this.count();

      const recentlyAddedResult = await this.db.getFirstAsync<{
        count: number;
      }>(
        'SELECT COUNT(*) as count FROM customers WHERE createdAt >= date("now", "-30 days")'
      );

      const withTransactionsResult = await this.db.getFirstAsync<{
        count: number;
      }>("SELECT COUNT(DISTINCT customerId) as count FROM transactions");

      const businessCustomersResult = await this.db.getFirstAsync<{
        count: number;
      }>(
        'SELECT COUNT(*) as count FROM customers WHERE company IS NOT NULL AND company != ""'
      );

      const activeCustomersResult = await this.db.getFirstAsync<{
        count: number;
      }>(
        'SELECT COUNT(*) as count FROM customers WHERE lastContactDate >= date("now", "-90 days")'
      );

      const averageSpendingResult = await this.db.getFirstAsync<{
        avg: number;
      }>("SELECT AVG(totalSpent) as avg FROM customers WHERE totalSpent > 0");

      const recentlyAdded = recentlyAddedResult?.count || 0;
      const withTransactions = withTransactionsResult?.count || 0;
      const businessCustomers = businessCustomersResult?.count || 0;
      const activeCustomers = activeCustomersResult?.count || 0;
      const individualCustomers = total - businessCustomers;
      const averageSpending = averageSpendingResult?.avg || 0;

      return {
        total,
        recentlyAdded,
        withTransactions,
        totalCustomers: total,
        activeCustomers,
        businessCustomers,
        individualCustomers,
        averageSpending,
      };
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "getCustomerStats",
        "Failed to get customer stats",
        error as Error
      );
    }
  }

  async updateLastContactDate(customerId: string): Promise<void> {
    try {
      await this.update(customerId, {
        lastContactDate: new Date().toISOString(),
      } as Partial<Customer>);
    } catch (error) {
      if (error instanceof RepositoryNotFoundError) {
        throw error;
      }
      throw new RepositoryError(
        "Customer",
        "updateLastContactDate",
        "Failed to update last contact date",
        error as Error
      );
    }
  }

  async searchCustomers(
    query: string,
    limit: number = 50
  ): Promise<Customer[]> {
    if (!query.trim()) {
      return this.findAll();
    }

    try {
      const searchPattern = `%${query.trim()}%`;
      const results = await this.db.getAllAsync<Customer>(
        `SELECT * FROM customers 
         WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?
         ORDER BY 
           CASE 
             WHEN name = ? THEN 1
             WHEN phone = ? THEN 2
             WHEN email = ? THEN 3
             WHEN name LIKE ? THEN 4
             WHEN phone LIKE ? THEN 5
             WHEN email LIKE ? THEN 6
             ELSE 7
           END
         LIMIT ?`,
        [
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          query,
          query,
          query,
          `${query}%`,
          `${query}%`,
          `${query}%`,
          limit,
        ]
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "searchCustomers",
        "Failed to search customers",
        error as Error
      );
    }
  }

  async getBirthdays(upcomingDays: number = 30): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        `SELECT * FROM customers 
         WHERE birthday IS NOT NULL 
         AND (
           strftime('%m-%d', birthday) BETWEEN 
           strftime('%m-%d', 'now') AND 
           strftime('%m-%d', 'now', '+${upcomingDays} days')
           OR
           (strftime('%m-%d', 'now', '+${upcomingDays} days') < strftime('%m-%d', 'now')
            AND (strftime('%m-%d', birthday) >= strftime('%m-%d', 'now') 
                 OR strftime('%m-%d', birthday) <= strftime('%m-%d', 'now', '+${upcomingDays} days')))
         )
         ORDER BY 
           CASE 
             WHEN strftime('%m-%d', birthday) >= strftime('%m-%d', 'now') 
             THEN strftime('%m-%d', birthday)
             ELSE strftime('%m-%d', birthday, '+1 year')
           END`
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "getBirthdays",
        "Failed to get upcoming birthdays",
        error as Error
      );
    }
  }

  async countWithFilters(
    filters?: CustomerFilters,
    searchQuery?: string
  ): Promise<number> {
    try {
      const { whereClause, params } =
        this.queryBuilder.buildCustomerFilterQuery(filters || {});

      let sql = `SELECT COUNT(*) as count FROM customers`;
      if (whereClause) {
        // Remove the "WHERE " prefix since we're adding it here
        const filterConditions = whereClause.replace(/^WHERE\s+/, "");
        sql += ` WHERE ${filterConditions}`;
      }
      if (searchQuery?.trim()) {
        const searchCondition = whereClause ? " AND " : " WHERE ";
        sql += `${searchCondition}(name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?)`;
        const searchPattern = `%${searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const result = await this.db.getFirstAsync<{ count: number }>(
        sql,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "countWithFilters",
        "Failed to count customers with filters",
        error as Error
      );
    }
  }

  async findWithSort(
    sort?: SortOptions,
    searchQuery?: string,
    page?: number,
    pageSize?: number
  ): Promise<Customer[]> {
    try {
      let sql = `SELECT * FROM customers`;
      const params: any[] = [];

      if (searchQuery?.trim()) {
        sql += ` WHERE (name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?)`;
        const searchPattern = `%${searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const sortField = sort?.field || "name";
      const sortDirection = sort?.direction || "asc";
      sql += ` ORDER BY ${sortField} ${sortDirection.toUpperCase()}`;

      if (pageSize && page !== undefined) {
        sql += ` LIMIT ? OFFSET ?`;
        params.push(pageSize, page * pageSize);
      }

      const results = await this.db.getAllAsync<Customer>(sql, params);
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findWithSort",
        "Failed to find customers with sort",
        error as Error
      );
    }
  }

  // ===== ADDITIONAL INTERFACE METHODS =====

  async findByCompany(company: string): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        "SELECT * FROM customers WHERE company = ? ORDER BY name ASC",
        [company]
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findByCompany",
        "Failed to find customers by company",
        error as Error
      );
    }
  }

  async findActiveCustomers(days: number = 90): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        'SELECT * FROM customers WHERE lastContactDate >= date("now", "-" || ? || " days") ORDER BY lastContactDate DESC',
        [days]
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findActiveCustomers",
        "Failed to find active customers",
        error as Error
      );
    }
  }

  async findInactiveCustomers(days: number = 90): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        'SELECT * FROM customers WHERE lastContactDate < date("now", "-" || ? || " days") OR lastContactDate IS NULL ORDER BY lastContactDate ASC',
        [days]
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findInactiveCustomers",
        "Failed to find inactive customers",
        error as Error
      );
    }
  }

  async getTopCustomers(limit: number = 10): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT ?",
        [limit]
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "getTopCustomers",
        "Failed to get top customers",
        error as Error
      );
    }
  }

  async findBusinessCustomers(): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        'SELECT * FROM customers WHERE company IS NOT NULL AND company != "" ORDER BY company ASC, name ASC'
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findBusinessCustomers",
        "Failed to find business customers",
        error as Error
      );
    }
  }

  async findIndividualCustomers(): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        'SELECT * FROM customers WHERE company IS NULL OR company = "" ORDER BY name ASC'
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findIndividualCustomers",
        "Failed to find individual customers",
        error as Error
      );
    }
  }

  async updateTotals(customerIds: string[]): Promise<void> {
    try {
      for (const customerId of customerIds) {
        // Get total spent and most recent transaction date
        const statsResult = await this.db.getFirstAsync<{
          total: number;
          lastPurchase: string;
        }>(
          `SELECT 
            SUM(amount) as total, 
            MAX(date) as lastPurchase 
           FROM transactions 
           WHERE customerId = ? AND type = 'sale'`,
          [customerId]
        );

        await this.update(customerId, {
          totalSpent: statsResult?.total || 0,
          lastPurchase: statsResult?.lastPurchase || undefined,
        } as Partial<Customer>);
      }
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "updateTotals",
        "Failed to update customer totals",
        error as Error
      );
    }
  }

  async recalculateCustomerStats(customerId: string): Promise<void> {
    await this.updateTotals([customerId]);
  }

  async createBulk(customers: CreateCustomerInput[]): Promise<Customer[]> {
    const results: Customer[] = [];
    try {
      for (const customerData of customers) {
        const customer = await this.createCustomer(customerData);
        results.push(customer);
      }
      return results;
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "createBulk",
        "Failed to create customers in bulk",
        error as Error
      );
    }
  }

  async updateBulk(
    updates: { id: string; data: UpdateCustomerInput }[]
  ): Promise<void> {
    try {
      for (const { id, data } of updates) {
        await this.update(id, data);
      }
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "updateBulk",
        "Failed to update customers in bulk",
        error as Error
      );
    }
  }

  async deleteBulk(customerIds: string[]): Promise<void> {
    try {
      for (const id of customerIds) {
        await this.delete(id);
      }
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "deleteBulk",
        "Failed to delete customers in bulk",
        error as Error
      );
    }
  }

  async search(query: string): Promise<Customer[]> {
    return this.searchCustomers(query);
  }

  async findByContactSource(source: string): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        "SELECT * FROM customers WHERE contactSource = ? ORDER BY name ASC",
        [source]
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findByContactSource",
        "Failed to find customers by contact source",
        error as Error
      );
    }
  }

  async findByPreferredContactMethod(method: string): Promise<Customer[]> {
    try {
      const results = await this.db.getAllAsync<Customer>(
        "SELECT * FROM customers WHERE preferredContactMethod = ? ORDER BY name ASC",
        [method]
      );
      return results.map((result) => this.augmentEntity(result));
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "findByPreferredContactMethod",
        "Failed to find customers by preferred contact method",
        error as Error
      );
    }
  }

  // ===== BACKWARD COMPATIBILITY METHODS =====

  async createCustomer(customerData: CreateCustomerInput): Promise<Customer> {
    // Transform CreateCustomerInput to the expected format for BaseRepository.create
    const customerWithDefaults = {
      ...customerData,
      totalSpent: 0,
      outstandingBalance: 0,
      creditBalance: 0,
      lastContactDate: undefined,
      contactSource: customerData.contactSource || "manual",
      birthday: customerData.birthday
        ? new Date(customerData.birthday).toISOString()
        : undefined,
    };

    return this.create(customerWithDefaults);
  }

  async updateCustomer(
    id: string,
    updates: UpdateCustomerInput
  ): Promise<void> {
    await this.update(id, updates);
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.delete(id);
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.findById(id);
  }

  async getAllCustomers(searchQuery?: string): Promise<Customer[]> {
    return this.findAll(searchQuery);
  }

  async getCustomersWithPagination(
    searchQuery?: string,
    page: number = 0,
    pageSize: number = this.config.defaultPageSize
  ) {
    return this.findWithPagination(searchQuery, page, pageSize);
  }

  // ===== DEBT MANAGEMENT METHODS =====

  /**
   * Increase customer's outstanding balance (when they incur debt)
   */
  async increaseOutstandingBalance(
    customerId: string,
    amount: number
  ): Promise<void> {
    if (!customerId?.trim()) {
      throw new RepositoryValidationError(
        "Customer",
        "increaseOutstandingBalance",
        "customerId",
        "Customer ID is required"
      );
    }
    if (amount <= 0) {
      throw new RepositoryValidationError(
        "Customer",
        "increaseOutstandingBalance",
        "amount",
        "Amount must be positive"
      );
    }

    try {
      await this.db.runAsync(
        `UPDATE customers SET outstandingBalance = outstandingBalance + ?, updatedAt = ? WHERE id = ?`,
        [amount, new Date().toISOString(), customerId]
      );

      await this.auditService.logEntry({
        tableName: "customers",
        operation: "UPDATE",
        recordId: customerId,
        newValues: { outstandingBalance: `+${amount}` },
      });
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "increaseOutstandingBalance",
        "Failed to increase outstanding balance",
        error as Error
      );
    }
  }

  /**
   * Decrease customer's outstanding balance (when they make payment)
   */
  async decreaseOutstandingBalance(
    customerId: string,
    amount: number
  ): Promise<void> {
    if (!customerId?.trim()) {
      throw new RepositoryValidationError(
        "Customer",
        "decreaseOutstandingBalance",
        "customerId",
        "Customer ID is required"
      );
    }
    if (amount <= 0) {
      throw new RepositoryValidationError(
        "Customer",
        "decreaseOutstandingBalance",
        "amount",
        "Amount must be positive"
      );
    }

    try {
      await this.db.runAsync(
        `UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?), updatedAt = ? WHERE id = ?`,
        [amount, new Date().toISOString(), customerId]
      );

      await this.auditService.logEntry({
        tableName: "customers",
        operation: "UPDATE",
        recordId: customerId,
        newValues: { outstandingBalance: `-${amount}` },
      });
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "decreaseOutstandingBalance",
        "Failed to decrease outstanding balance",
        error as Error
      );
    }
  }

  /**
   * Get customer's current outstanding balance
   */
  async getOutstandingBalance(customerId: string): Promise<number> {
    if (!customerId?.trim()) {
      throw new RepositoryValidationError(
        "Customer",
        "getOutstandingBalance",
        "customerId",
        "Customer ID is required"
      );
    }

    try {
      const result = await this.db.getFirstAsync<{
        outstandingBalance: number;
      }>("SELECT outstandingBalance FROM customers WHERE id = ?", [customerId]);

      if (!result) {
        throw new RepositoryNotFoundError("Customer", customerId);
      }

      return result.outstandingBalance || 0;
    } catch (error) {
      if (error instanceof RepositoryNotFoundError) {
        throw error;
      }
      throw new RepositoryError(
        "Customer",
        "getOutstandingBalance",
        "Failed to get outstanding balance",
        error as Error
      );
    }
  }

  /**
   * Update customer's total spent (for cash transactions)
   */
  async updateTotalSpent(customerId: string, amount: number): Promise<void> {
    if (!customerId?.trim()) {
      throw new RepositoryValidationError(
        "Customer",
        "updateTotalSpent",
        "customerId",
        "Customer ID is required"
      );
    }
    if (amount <= 0) {
      throw new RepositoryValidationError(
        "Customer",
        "updateTotalSpent",
        "amount",
        "Amount must be positive"
      );
    }

    try {
      await this.db.runAsync(
        `UPDATE customers SET totalSpent = totalSpent + ?, updatedAt = ? WHERE id = ?`,
        [amount, new Date().toISOString(), customerId]
      );

      await this.auditService.logEntry({
        tableName: "customers",
        operation: "UPDATE",
        recordId: customerId,
        newValues: { totalSpent: `+${amount}` },
      });
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "updateTotalSpent",
        "Failed to update total spent",
        error as Error
      );
    }
  }

  /**
   * Get customer's credit balance
   */
  async getCreditBalance(customerId: string): Promise<number> {
    if (!customerId?.trim()) {
      throw new RepositoryValidationError(
        "Customer",
        "getCreditBalance",
        "customerId",
        "Customer ID is required"
      );
    }

    try {
      const result = await this.db.getFirstAsync<{
        credit_balance: number;
      }>("SELECT credit_balance FROM customers WHERE id = ?", [customerId]);

      if (!result) {
        throw new RepositoryNotFoundError("Customer", customerId);
      }

      return result.credit_balance || 0;
    } catch (error) {
      if (error instanceof RepositoryNotFoundError) {
        throw error;
      }
      throw new RepositoryError(
        "Customer",
        "getCreditBalance",
        "Failed to get credit balance",
        error as Error
      );
    }
  }

  /**
   * Increase customer's credit balance (when they have over-payment)
   */
  async increaseCreditBalance(
    customerId: string,
    amount: number
  ): Promise<void> {
    if (!customerId?.trim()) {
      throw new RepositoryValidationError(
        "Customer",
        "increaseCreditBalance",
        "customerId",
        "Customer ID is required"
      );
    }
    if (amount <= 0) {
      throw new RepositoryValidationError(
        "Customer",
        "increaseCreditBalance",
        "amount",
        "Amount must be positive"
      );
    }

    try {
      await this.db.runAsync(
        `UPDATE customers SET credit_balance = credit_balance + ?, updatedAt = ? WHERE id = ?`,
        [amount, new Date().toISOString(), customerId]
      );

      await this.auditService.logEntry({
        tableName: "customers",
        operation: "UPDATE",
        recordId: customerId,
        newValues: { credit_balance: `+${amount}` },
      });
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "increaseCreditBalance",
        "Failed to increase credit balance",
        error as Error
      );
    }
  }

  /**
   * Decrease customer's credit balance (when they use credit)
   */
  async decreaseCreditBalance(
    customerId: string,
    amount: number
  ): Promise<void> {
    if (!customerId?.trim()) {
      throw new RepositoryValidationError(
        "Customer",
        "decreaseCreditBalance",
        "customerId",
        "Customer ID is required"
      );
    }
    if (amount <= 0) {
      throw new RepositoryValidationError(
        "Customer",
        "decreaseCreditBalance",
        "amount",
        "Amount must be positive"
      );
    }

    try {
      await this.db.runAsync(
        `UPDATE customers SET credit_balance = GREATEST(0, credit_balance - ?), updatedAt = ? WHERE id = ?`,
        [amount, new Date().toISOString(), customerId]
      );

      await this.auditService.logEntry({
        tableName: "customers",
        operation: "UPDATE",
        recordId: customerId,
        newValues: { credit_balance: `-${amount}` },
      });
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "decreaseCreditBalance",
        "Failed to decrease credit balance",
        error as Error
      );
    }
  }

  protected buildInsertQuery(entity: Customer): {
    columns: string;
    values: any[];
    placeholders: string;
  } {
    // Map camelCase properties to snake_case database columns
    const columnMapping: Record<string, string> = {
      creditBalance: "credit_balance",
    };

    const mappedEntity = { ...entity };
    for (const [camelCase, snakeCase] of Object.entries(columnMapping)) {
      if (camelCase in mappedEntity) {
        (mappedEntity as any)[snakeCase] = (mappedEntity as any)[camelCase];
        delete (mappedEntity as any)[camelCase];
      }
    }

    const entries = Object.entries(mappedEntity as Record<string, any>).filter(
      ([_, value]) => value !== undefined
    );

    const columns = entries.map(([key]) => key).join(", ");
    const values = entries.map(([_, value]) => value);
    const placeholders = entries.map(() => "?").join(", ");

    return { columns, values, placeholders };
  }

  protected buildUpdateQuery(data: Partial<Customer>): {
    setClause: string;
    values: any[];
  } {
    // Map camelCase properties to snake_case database columns
    const columnMapping: Record<string, string> = {
      creditBalance: "credit_balance",
    };

    const mappedData = { ...data };
    for (const [camelCase, snakeCase] of Object.entries(columnMapping)) {
      if (camelCase in mappedData) {
        (mappedData as any)[snakeCase] = (mappedData as any)[camelCase];
        delete (mappedData as any)[camelCase];
      }
    }

    const entries = Object.entries(mappedData as Record<string, any>).filter(
      ([key, value]) => key !== "id" && value !== undefined
    );

    if (entries.length === 0) {
      return { setClause: "", values: [] };
    }

    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([_, value]) => value);

    return { setClause, values };
  }

  /**
   * Update customer's outstanding balance to a specific value
   */
  async updateBalance(customerId: string, newBalance: number): Promise<void> {
    if (!customerId?.trim()) {
      throw new RepositoryValidationError(
        "Customer",
        "updateBalance",
        "customerId",
        "Customer ID is required"
      );
    }
    if (newBalance < 0) {
      throw new RepositoryValidationError(
        "Customer",
        "updateBalance",
        "newBalance",
        "Balance cannot be negative"
      );
    }

    try {
      await this.db.runAsync(
        "UPDATE customers SET outstandingBalance = ?, updatedAt = ? WHERE id = ?",
        [newBalance, new Date().toISOString(), customerId]
      );

      await this.auditService.logEntry({
        tableName: "customers",
        operation: "UPDATE",
        recordId: customerId,
        newValues: { outstandingBalance: newBalance },
      });
    } catch (error) {
      throw new RepositoryError(
        "Customer",
        "updateBalance",
        "Failed to update customer balance",
        error as Error
      );
    }
  }
}
