import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/types/transaction";
import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogService } from "../service/AuditLogService";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../service/utilService";
import { ValidationService } from "../service/ValidationService";
import { CustomerRepository } from "./CustomerRepository";
import { ITransactionRepository } from "./interfaces/ITransactionRepository";

// ===== TRANSACTION REPOSITORY =====
export class TransactionRepository implements ITransactionRepository {
  constructor(
    private db: SQLiteDatabase,
    private auditService: AuditLogService,
    private customerRepo: CustomerRepository
  ) {}

  async create(transactionData: CreateTransactionInput): Promise<Transaction> {
    ValidationService.validateTransactionInput(transactionData);

    try {
      const customer = await this.customerRepo.findById(
        transactionData.customerId
      );
      if (!customer) {
        throw new NotFoundError("Customer", transactionData.customerId);
      }

      const id = generateId("txn");
      const transaction: Transaction = {
        id,
        customerId: transactionData.customerId,
        productId: transactionData.productId,
        amount: transactionData.amount,
        description: transactionData.description || undefined,
        date: transactionData.date,
        type: transactionData.type,
      };

      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          `INSERT INTO transactions (id, customerId, productId, amount, description, date, type) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction.id,
            transaction.customerId,
            transaction.productId || null,
            transaction.amount,
            transaction.description || null,
            transaction.date,
            transaction.type,
          ]
        );

        await this.customerRepo.updateTotals([transaction.customerId]);

        await this.auditService.logEntry({
          tableName: "transactions",
          operation: "CREATE",
          recordId: transaction.id,
          newValues: transaction,
        });
      });

      return transaction;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("create", error as Error);
    }
  }

  async findByCustomer(customerId: string): Promise<Transaction[]> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC",
        [customerId]
      );
    } catch (error) {
      throw new DatabaseError("findByCustomer", error as Error);
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    try {
      return await this.db.getFirstAsync<Transaction>(
        "SELECT * FROM transactions WHERE id = ?",
        [id]
      );
    } catch (error) {
      throw new DatabaseError("findById", error as Error);
    }
  }

  async update(id: string, updates: UpdateTransactionInput): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    ValidationService.validateTransactionInput(updates);

    try {
      const currentTransaction = await this.findById(id);
      if (!currentTransaction) {
        throw new NotFoundError("Transaction", id);
      }

      await this.db.withTransactionAsync(async () => {
        const fields = Object.keys(updates).filter((key) => key !== "id");
        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => {
          const value = (updates as any)[field];
          return field === "date" && value
            ? new Date(value).toISOString()
            : value;
        });

        await this.db.runAsync(
          `UPDATE transactions SET ${setClause} WHERE id = ?`,
          [...values, id]
        );
        await this.customerRepo.updateTotals([currentTransaction.customerId]);

        await this.auditService.logEntry({
          tableName: "transactions",
          operation: "UPDATE",
          recordId: id,
          oldValues: currentTransaction,
          newValues: { ...currentTransaction, ...updates },
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("update", error as Error);
    }
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    try {
      const transaction = await this.findById(id);
      if (!transaction) {
        throw new NotFoundError("Transaction", id);
      }

      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
        await this.customerRepo.updateTotals([transaction.customerId]);

        await this.auditService.logEntry({
          tableName: "transactions",
          operation: "DELETE",
          recordId: id,
          oldValues: transaction,
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("delete", error as Error);
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions ORDER BY date DESC"
      );
    } catch (error) {
      throw new DatabaseError("getAllTransactions", error as Error);
    }
  }

  // IBaseRepository methods
  async findAll(searchQuery?: string): Promise<Transaction[]> {
    try {
      if (searchQuery) {
        return await this.db.getAllAsync<Transaction>(
          "SELECT * FROM transactions WHERE description LIKE ? ORDER BY date DESC",
          [`%${searchQuery}%`]
        );
      }
      return await this.getAllTransactions();
    } catch (error) {
      throw new DatabaseError("findAll", error as Error);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM transactions WHERE id = ?",
        [id]
      );
      return (result?.count ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError("exists", error as Error);
    }
  }

  async count(searchQuery?: string): Promise<number> {
    try {
      if (searchQuery) {
        const result = await this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM transactions WHERE description LIKE ?",
          [`%${searchQuery}%`]
        );
        return result?.count ?? 0;
      }
      const result = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM transactions"
      );
      return result?.count ?? 0;
    } catch (error) {
      throw new DatabaseError("count", error as Error);
    }
  }

  // IPaginatedRepository method
  async findWithPagination(
    searchQuery?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    items: Transaction[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    try {
      const offset = (page - 1) * pageSize;
      let query = "SELECT * FROM transactions";
      let countQuery = "SELECT COUNT(*) as count FROM transactions";
      const params: any[] = [];
      const countParams: any[] = [];

      if (searchQuery) {
        query += " WHERE description LIKE ?";
        countQuery += " WHERE description LIKE ?";
        params.push(`%${searchQuery}%`);
        countParams.push(`%${searchQuery}%`);
      }

      query += " ORDER BY date DESC LIMIT ? OFFSET ?";
      params.push(pageSize, offset);

      const [items, countResult] = await Promise.all([
        this.db.getAllAsync<Transaction>(query, params),
        this.db.getFirstAsync<{ count: number }>(countQuery, countParams),
      ]);

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      throw new DatabaseError("findWithPagination", error as Error);
    }
  }

  // Rename findByCustomer to findByCustomerId to match interface
  async findByCustomerId(customerId: string): Promise<Transaction[]> {
    return this.findByCustomer(customerId);
  }

  // Transaction-specific methods
  async findByType(type: string): Promise<Transaction[]> {
    if (!type?.trim()) {
      throw new ValidationError("Transaction type is required");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE type = ? ORDER BY date DESC",
        [type]
      );
    } catch (error) {
      throw new DatabaseError("findByType", error as Error);
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    if (!startDate || !endDate) {
      throw new ValidationError("Start date and end date are required");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC",
        [startDate, endDate]
      );
    } catch (error) {
      throw new DatabaseError("findByDateRange", error as Error);
    }
  }

  async findByAmountRange(
    minAmount: number,
    maxAmount: number
  ): Promise<Transaction[]> {
    if (minAmount < 0 || maxAmount < 0 || minAmount > maxAmount) {
      throw new ValidationError("Invalid amount range");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE amount >= ? AND amount <= ? ORDER BY date DESC",
        [minAmount, maxAmount]
      );
    } catch (error) {
      throw new DatabaseError("findByAmountRange", error as Error);
    }
  }

  async findByCustomerAndDateRange(
    customerId: string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required");
    }
    if (!startDate || !endDate) {
      throw new ValidationError("Start date and end date are required");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE customerId = ? AND date >= ? AND date <= ? ORDER BY date DESC",
        [customerId, startDate, endDate]
      );
    } catch (error) {
      throw new DatabaseError("findByCustomerAndDateRange", error as Error);
    }
  }

  async getTotalByCustomer(customerId: string): Promise<number> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        "SELECT SUM(amount) as total FROM transactions WHERE customerId = ?",
        [customerId]
      );
      return result?.total ?? 0;
    } catch (error) {
      throw new DatabaseError("getTotalByCustomer", error as Error);
    }
  }

  async getTotalByType(type: string): Promise<number> {
    if (!type?.trim()) {
      throw new ValidationError("Transaction type is required");
    }

    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        "SELECT SUM(amount) as total FROM transactions WHERE type = ?",
        [type]
      );
      return result?.total ?? 0;
    } catch (error) {
      throw new DatabaseError("getTotalByType", error as Error);
    }
  }

  async getTotalByDateRange(
    startDate: string,
    endDate: string
  ): Promise<number> {
    if (!startDate || !endDate) {
      throw new ValidationError("Start date and end date are required");
    }

    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        "SELECT SUM(amount) as total FROM transactions WHERE date >= ? AND date <= ?",
        [startDate, endDate]
      );
      return result?.total ?? 0;
    } catch (error) {
      throw new DatabaseError("getTotalByDateRange", error as Error);
    }
  }

  async getAverageTransactionAmount(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ average: number }>(
        "SELECT AVG(amount) as average FROM transactions"
      );
      return result?.average ?? 0;
    } catch (error) {
      throw new DatabaseError("getAverageTransactionAmount", error as Error);
    }
  }

  async getRevenueByPeriod(
    startDate: string,
    endDate: string
  ): Promise<number> {
    if (!startDate || !endDate) {
      throw new ValidationError("Start date and end date are required");
    }

    try {
      const result = await this.db.getFirstAsync<{ revenue: number }>(
        "SELECT SUM(amount) as revenue FROM transactions WHERE type = 'sale' AND date >= ? AND date <= ?",
        [startDate, endDate]
      );
      return result?.revenue ?? 0;
    } catch (error) {
      throw new DatabaseError("getRevenueByPeriod", error as Error);
    }
  }

  async getRevenueByCustomer(customerId: string): Promise<number> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      const result = await this.db.getFirstAsync<{ revenue: number }>(
        "SELECT SUM(amount) as revenue FROM transactions WHERE customerId = ? AND type = 'sale'",
        [customerId]
      );
      return result?.revenue ?? 0;
    } catch (error) {
      throw new DatabaseError("getRevenueByCustomer", error as Error);
    }
  }

  async getRevenueByType(type: string): Promise<number> {
    if (!type?.trim()) {
      throw new ValidationError("Transaction type is required");
    }

    try {
      const result = await this.db.getFirstAsync<{ revenue: number }>(
        "SELECT SUM(amount) as revenue FROM transactions WHERE type = ?",
        [type]
      );
      return result?.revenue ?? 0;
    } catch (error) {
      throw new DatabaseError("getRevenueByType", error as Error);
    }
  }

  async getTransactionStats(): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    averageAmount: number;
    salesCount: number;
    refundCount: number;
    paymentCount: number;
  }> {
    try {
      const queries = [
        "SELECT COUNT(*) as totalTransactions FROM transactions",
        "SELECT SUM(amount) as totalRevenue FROM transactions WHERE type = 'sale'",
        "SELECT AVG(amount) as averageAmount FROM transactions",
        "SELECT COUNT(*) as salesCount FROM transactions WHERE type = 'sale'",
        "SELECT COUNT(*) as refundCount FROM transactions WHERE type = 'refund'",
        "SELECT COUNT(*) as paymentCount FROM transactions WHERE type = 'payment'",
      ];

      const results = await Promise.all(
        queries.map((query) => this.db.getFirstAsync(query))
      );

      return {
        totalTransactions:
          (results[0] as { totalTransactions: number })?.totalTransactions ?? 0,
        totalRevenue:
          (results[1] as { totalRevenue: number })?.totalRevenue ?? 0,
        averageAmount:
          (results[2] as { averageAmount: number })?.averageAmount ?? 0,
        salesCount: (results[3] as { salesCount: number })?.salesCount ?? 0,
        refundCount: (results[4] as { refundCount: number })?.refundCount ?? 0,
        paymentCount:
          (results[5] as { paymentCount: number })?.paymentCount ?? 0,
      };
    } catch (error) {
      throw new DatabaseError("getTransactionStats", error as Error);
    }
  }

  async getDailyTransactions(date: string): Promise<Transaction[]> {
    if (!date) {
      throw new ValidationError("Date is required");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE DATE(date) = DATE(?) ORDER BY date DESC",
        [date]
      );
    } catch (error) {
      throw new DatabaseError("getDailyTransactions", error as Error);
    }
  }

  async getMonthlyTransactions(
    year: number,
    month: number
  ): Promise<Transaction[]> {
    if (year < 1900 || month < 1 || month > 12) {
      throw new ValidationError("Invalid year or month");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ? ORDER BY date DESC",
        [year.toString(), month.toString().padStart(2, "0")]
      );
    } catch (error) {
      throw new DatabaseError("getMonthlyTransactions", error as Error);
    }
  }

  async getDailyRevenue(date: string): Promise<number> {
    if (!date) {
      throw new ValidationError("Date is required");
    }

    try {
      const result = await this.db.getFirstAsync<{ revenue: number }>(
        "SELECT SUM(amount) as revenue FROM transactions WHERE type = 'sale' AND DATE(date) = DATE(?)",
        [date]
      );
      return result?.revenue ?? 0;
    } catch (error) {
      throw new DatabaseError("getDailyRevenue", error as Error);
    }
  }

  async getMonthlyRevenue(year: number, month: number): Promise<number> {
    if (year < 1900 || month < 1 || month > 12) {
      throw new ValidationError("Invalid year or month");
    }

    try {
      const result = await this.db.getFirstAsync<{ revenue: number }>(
        "SELECT SUM(amount) as revenue FROM transactions WHERE type = 'sale' AND strftime('%Y', date) = ? AND strftime('%m', date) = ?",
        [year.toString(), month.toString().padStart(2, "0")]
      );
      return result?.revenue ?? 0;
    } catch (error) {
      throw new DatabaseError("getMonthlyRevenue", error as Error);
    }
  }

  async createBulk(
    transactions: CreateTransactionInput[]
  ): Promise<Transaction[]> {
    if (!transactions.length) {
      throw new ValidationError("At least one transaction is required");
    }

    transactions.forEach((t) => ValidationService.validateTransactionInput(t));

    try {
      const createdTransactions: Transaction[] = [];

      await this.db.withTransactionAsync(async () => {
        for (const transactionData of transactions) {
          const customer = await this.customerRepo.findById(
            transactionData.customerId
          );
          if (!customer) {
            throw new NotFoundError("Customer", transactionData.customerId);
          }

          const id = generateId("txn");
          const transaction: Transaction = {
            id,
            customerId: transactionData.customerId,
            productId: transactionData.productId,
            amount: transactionData.amount,
            description: transactionData.description || undefined,
            date: transactionData.date,
            type: transactionData.type,
          };

          await this.db.runAsync(
            `INSERT INTO transactions (id, customerId, productId, amount, description, date, type) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              transaction.id,
              transaction.customerId,
              transaction.productId || null,
              transaction.amount,
              transaction.description || null,
              transaction.date,
              transaction.type,
            ]
          );

          createdTransactions.push(transaction);

          await this.auditService.logEntry({
            tableName: "transactions",
            operation: "CREATE",
            recordId: transaction.id,
            newValues: transaction,
          });
        }

        const customerIds = [...new Set(transactions.map((t) => t.customerId))];
        await this.customerRepo.updateTotals(customerIds);
      });

      return createdTransactions;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("createBulk", error as Error);
    }
  }

  async updateBulk(
    updates: { id: string; data: UpdateTransactionInput }[]
  ): Promise<void> {
    if (!updates.length) {
      throw new ValidationError("At least one update is required");
    }

    updates.forEach((u) => {
      if (!u.id?.trim()) {
        throw new ValidationError("Transaction ID is required for each update");
      }
      ValidationService.validateTransactionInput(u.data);
    });

    try {
      await this.db.withTransactionAsync(async () => {
        for (const update of updates) {
          const currentTransaction = await this.findById(update.id);
          if (!currentTransaction) {
            throw new NotFoundError("Transaction", update.id);
          }

          const fields = Object.keys(update.data).filter((key) => key !== "id");
          const setClause = fields.map((field) => `${field} = ?`).join(", ");
          const values = fields.map((field) => {
            const value = (update.data as any)[field];
            return field === "date" && value
              ? new Date(value).toISOString()
              : value;
          });

          await this.db.runAsync(
            `UPDATE transactions SET ${setClause} WHERE id = ?`,
            [...values, update.id]
          );

          await this.auditService.logEntry({
            tableName: "transactions",
            operation: "UPDATE",
            recordId: update.id,
            oldValues: currentTransaction,
            newValues: { ...currentTransaction, ...update.data },
          });
        }

        const customerIds = [
          ...new Set(
            (
              await Promise.all(
                updates.map(async (u) => {
                  const transaction = await this.findById(u.id);
                  return transaction?.customerId;
                })
              )
            ).filter((id): id is string => id !== undefined)
          ),
        ];
        await this.customerRepo.updateTotals(customerIds);
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("updateBulk", error as Error);
    }
  }

  async deleteBulk(transactionIds: string[]): Promise<void> {
    if (!transactionIds.length) {
      throw new ValidationError("At least one transaction ID is required");
    }

    transactionIds.forEach((id) => {
      if (!id?.trim()) {
        throw new ValidationError("Transaction ID cannot be empty");
      }
    });

    try {
      const transactions = await Promise.all(
        transactionIds.map((id) => this.findById(id))
      );

      const missingIds = transactionIds.filter(
        (id, index) => !transactions[index]
      );
      if (missingIds.length) {
        throw new NotFoundError("Transaction", missingIds.join(", "));
      }

      await this.db.withTransactionAsync(async () => {
        for (const id of transactionIds) {
          await this.db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
        }

        const customerIds = [
          ...new Set(transactions.map((t) => t!.customerId)),
        ];
        await this.customerRepo.updateTotals(customerIds);

        for (const transaction of transactions) {
          await this.auditService.logEntry({
            tableName: "transactions",
            operation: "DELETE",
            recordId: transaction!.id,
            oldValues: transaction!,
          });
        }
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("deleteBulk", error as Error);
    }
  }

  async findLargeTransactions(threshold: number): Promise<Transaction[]> {
    if (threshold <= 0) {
      throw new ValidationError("Threshold must be positive");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE amount >= ? ORDER BY amount DESC",
        [threshold]
      );
    } catch (error) {
      throw new DatabaseError("findLargeTransactions", error as Error);
    }
  }

  async findRecentTransactions(days: number): Promise<Transaction[]> {
    if (days <= 0) {
      throw new ValidationError("Days must be positive");
    }

    try {
      const date = new Date();
      date.setDate(date.getDate() - days);
      const dateString = date.toISOString();

      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE date >= ? ORDER BY date DESC",
        [dateString]
      );
    } catch (error) {
      throw new DatabaseError("findRecentTransactions", error as Error);
    }
  }

  async findTransactionsByDescription(
    description: string
  ): Promise<Transaction[]> {
    if (!description?.trim()) {
      throw new ValidationError("Description is required");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE description LIKE ? ORDER BY date DESC",
        [`%${description}%`]
      );
    } catch (error) {
      throw new DatabaseError("findTransactionsByDescription", error as Error);
    }
  }
}
