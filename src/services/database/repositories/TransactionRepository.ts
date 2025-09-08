import {
  CreateTransactionInput,
  PaymentMethod,
  Transaction,
  TransactionStatus,
  UpdateTransactionInput,
} from "@/types/transaction";
import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogService } from "../service/AuditLogService";
import { PaymentService } from "../service/PaymentService";
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
    private customerRepo: CustomerRepository,
    private paymentService?: PaymentService
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

      // Calculate proper paidAmount and remainingAmount based on transaction type and payment method
      let paidAmount: number;
      let remainingAmount: number;
      let paymentMethod: PaymentMethod;

      if (transactionData.type === "credit") {
        // Credit transactions: no payment received, full amount becomes debt
        paidAmount = 0;
        remainingAmount = transactionData.amount;
        paymentMethod = "credit"; // Credit transactions always use credit payment method
      } else if (transactionData.type === "payment") {
        // Payment transactions: full amount is paid, no remaining
        paidAmount = transactionData.amount;
        remainingAmount = 0;
        paymentMethod = transactionData.paymentMethod || "cash";
      } else if (transactionData.paymentMethod === "credit") {
        // Sale with credit payment: no payment received, full amount becomes debt
        paidAmount = 0;
        remainingAmount = transactionData.amount;
        paymentMethod = "credit";
      } else if (transactionData.paymentMethod === "mixed") {
        // Mixed payment: use provided amounts
        paidAmount = transactionData.paidAmount || 0;
        remainingAmount =
          transactionData.remainingAmount ||
          transactionData.amount - paidAmount;
        paymentMethod = "mixed";
      } else {
        // Cash, bank transfer, POS card: full payment received
        paidAmount = transactionData.amount;
        remainingAmount = 0;
        paymentMethod = transactionData.paymentMethod || "cash";
      }

      const transaction: Transaction = {
        id,
        customerId: transactionData.customerId,
        productId: transactionData.productId,
        amount: transactionData.amount,
        description: transactionData.description || undefined,
        date: transactionData.date,
        type: transactionData.type,
        paymentMethod: paymentMethod, // Use calculated payment method
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        status: this.calculateTransactionStatusWithValues(
          transactionData.type,
          paymentMethod,
          transactionData.amount,
          paidAmount,
          remainingAmount
        ),
        linkedTransactionId: transactionData.linkedTransactionId,
        appliedToDebt: transactionData.appliedToDebt,
        dueDate: transactionData.dueDate,
        currency: transactionData.currency || "NGN",
        exchangeRate: transactionData.exchangeRate || 1,
        metadata: transactionData.metadata,
        isDeleted: false,
      };

      await this.db.withTransactionAsync(async () => {
        // Insert the transaction
        await this.db.runAsync(
          `INSERT INTO transactions (id, customerId, productId, amount, description, date, type, paymentMethod, paidAmount, remainingAmount, status, linkedTransactionId, appliedToDebt, dueDate, currency, exchangeRate, metadata, isDeleted) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction.id,
            transaction.customerId,
            transaction.productId || null,
            transaction.amount,
            transaction.description || null,
            transaction.date,
            transaction.type,
            transaction.paymentMethod || "cash",
            paidAmount, // Use calculated paidAmount directly
            remainingAmount, // Use calculated remainingAmount directly
            transaction.status || "completed",
            transaction.linkedTransactionId || null,
            transaction.appliedToDebt ? 1 : 0,
            transaction.dueDate || null,
            transaction.currency || "NGN",
            transaction.exchangeRate || 1,
            transaction.metadata || null,
            transaction.isDeleted ? 1 : 0,
          ]
        );

        // Handle debt management within the same transaction
        await this.handleDebtManagementInTransaction(transaction);

        // Ensure customer totals (totalSpent and lastPurchase) are updated atomically
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
          if (field === "date" && value) {
            return new Date(value).toISOString();
          }
          if (field === "appliedToDebt") {
            return value ? 1 : 0;
          }
          return value;
        });

        await this.db.runAsync(
          `UPDATE transactions SET ${setClause} WHERE id = ?`,
          [...values, id]
        );

        // Handle debt management changes within the same transaction
        const updatedTransaction = { ...currentTransaction, ...updates };
        await this.handleDebtUpdateInTransaction(
          currentTransaction,
          updatedTransaction
        );

        // Ensure customer totals reflect the updated transaction
        await this.customerRepo.updateTotals([updatedTransaction.customerId]);

        // Handle total spent changes for sale transactions
        if (
          currentTransaction.type === "sale" &&
          updates.amount !== undefined
        ) {
          const amountDifference = updates.amount - currentTransaction.amount;
          if (amountDifference !== 0) {
            await this.db.runAsync(
              `UPDATE customers SET totalSpent = totalSpent + ?, updatedAt = ? WHERE id = ?`,
              [
                amountDifference,
                new Date().toISOString(),
                currentTransaction.customerId,
              ]
            );
          }
        }

        await this.auditService.logEntry({
          tableName: "transactions",
          operation: "UPDATE",
          recordId: id,
          oldValues: currentTransaction,
          newValues: updatedTransaction,
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
            paymentMethod: transactionData.paymentMethod || "cash",
            paidAmount: transactionData.paidAmount || transactionData.amount,
            remainingAmount: transactionData.remainingAmount || 0,
            status: this.calculateTransactionStatus(transactionData),
            linkedTransactionId: transactionData.linkedTransactionId,
            appliedToDebt: transactionData.appliedToDebt,
            dueDate: transactionData.dueDate,
            currency: transactionData.currency || "NGN",
            exchangeRate: transactionData.exchangeRate || 1,
            metadata: transactionData.metadata,
            isDeleted: false,
          };

          await this.db.runAsync(
            `INSERT INTO transactions (id, customerId, productId, amount, description, date, type, paymentMethod, paidAmount, remainingAmount, status, linkedTransactionId, appliedToDebt, dueDate, currency, exchangeRate, metadata, isDeleted) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              transaction.id,
              transaction.customerId,
              transaction.productId || null,
              transaction.amount,
              transaction.description || null,
              transaction.date,
              transaction.type,
              transaction.paymentMethod || "cash",
              transaction.paidAmount || transaction.amount,
              transaction.remainingAmount || 0,
              transaction.status || "completed",
              transaction.linkedTransactionId || null,
              transaction.appliedToDebt ? 1 : 0,
              transaction.dueDate || null,
              transaction.currency || "NGN",
              transaction.exchangeRate || 1,
              transaction.metadata || null,
              transaction.isDeleted ? 1 : 0,
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

  // ===== DEBT MANAGEMENT METHODS =====

  /**
   * Handle debt management logic based on transaction type
   */
  private async handleDebtManagement(transaction: Transaction): Promise<void> {
    const debtAmount = transaction.remainingAmount || 0;

    switch (transaction.type) {
      case "sale":
        // Update total spent for all sales
        await this.customerRepo.updateTotalSpent(
          transaction.customerId,
          transaction.amount
        );

        if (
          (transaction.paymentMethod === "credit" ||
            transaction.paymentMethod === "mixed") &&
          debtAmount > 0
        ) {
          // For credit/mixed payments, check if customer has available credit first
          if (this.paymentService) {
            const creditResult = await this.paymentService.applyCreditToSale(
              transaction.customerId,
              debtAmount,
              transaction.id,
              true // withinExistingTransaction = true
            );

            // If credit was applied, reduce the debt amount
            const remainingDebt = creditResult.remainingAmount;

            if (remainingDebt > 0) {
              // Only create debt for the remaining amount after credit application
              await this.customerRepo.increaseOutstandingBalance(
                transaction.customerId,
                remainingDebt
              );
            }
          } else {
            // Fallback to old method if PaymentService not available
            await this.customerRepo.increaseOutstandingBalance(
              transaction.customerId,
              debtAmount
            );
          }
        }
        // For cash sales, no additional debt impact beyond total spent
        break;

      case "payment":
        // Payment received: use PaymentService to handle allocation only if appliedToDebt is true
        if (this.paymentService && transaction.appliedToDebt) {
          try {
            // Use PaymentService to handle proper payment allocation
            await this.paymentService.handlePaymentAllocation(
              transaction.customerId,
              transaction.id,
              transaction.amount,
              true // withinExistingTransaction = true
            );
          } catch (error) {
            console.warn(
              "PaymentService allocation failed, using fallback:",
              error
            );
            // Fallback to old method if PaymentService fails
            await this.customerRepo.decreaseOutstandingBalance(
              transaction.customerId,
              transaction.amount
            );
          }
        } else if (transaction.appliedToDebt) {
          // Fallback to old method if PaymentService not available but appliedToDebt is true
          await this.customerRepo.decreaseOutstandingBalance(
            transaction.customerId,
            transaction.amount
          );
        }
        // If appliedToDebt is false, don't reduce outstanding balance (future service deposit)
        break;

      case "credit":
        // Credit/loan issued: increase customer's outstanding balance
        await this.customerRepo.increaseOutstandingBalance(
          transaction.customerId,
          transaction.amount
        );
        break;

      case "refund":
        // Refund: decrease customer's outstanding balance
        await this.customerRepo.decreaseOutstandingBalance(
          transaction.customerId,
          transaction.amount
        );
        break;
    }
  }

  /**
   * Calculate transaction status based on transaction type, payment method, and amounts
   */
  private calculateTransactionStatusWithValues(
    type: string,
    paymentMethod: PaymentMethod,
    amount: number,
    paidAmount: number,
    remainingAmount: number
  ): TransactionStatus {
    // Use PaymentService for accurate status calculation if available
    if (this.paymentService) {
      return this.paymentService.calculateTransactionStatus(
        type,
        paymentMethod,
        amount,
        paidAmount,
        remainingAmount
      ) as TransactionStatus;
    }

    // Fallback to original logic with calculated values
    if (type === "payment") {
      return "completed";
    }

    if (type === "credit") {
      return remainingAmount > 0 ? "pending" : "completed";
    }

    if (paymentMethod === "cash" || paidAmount >= amount) {
      return "completed";
    }

    if (paymentMethod === "mixed") {
      return remainingAmount > 0 ? "partial" : "completed";
    }

    if (paymentMethod === "credit" || remainingAmount > 0) {
      return "pending";
    }

    return "completed";
  }

  /**
   * Calculate transaction status based on input data (legacy method)
   */
  private calculateTransactionStatus(
    data: CreateTransactionInput
  ): TransactionStatus {
    // Use PaymentService for accurate status calculation if available
    if (this.paymentService) {
      return this.paymentService.calculateTransactionStatus(
        data.type,
        data.paymentMethod || "cash",
        data.amount,
        data.paidAmount || 0,
        data.remainingAmount || 0
      ) as TransactionStatus;
    }

    // Fallback to original logic
    if (data.type === "payment") {
      return "completed";
    }

    if (
      data.paymentMethod === "cash" ||
      (data.paidAmount || 0) >= (data.amount || 0)
    ) {
      return "completed";
    }

    if (data.paymentMethod === "mixed") {
      return (data.remainingAmount || 0) > 0 ? "partial" : "completed";
    }

    if (data.paymentMethod === "credit" || (data.remainingAmount || 0) > 0) {
      return "pending";
    }

    return "completed";
  }

  /**
   * Apply payment to outstanding debts (allocates to oldest debts first)
   */
  async applyPaymentToDebt(
    paymentTx: CreateTransactionInput,
    applyToOldest: boolean = true
  ): Promise<void> {
    ValidationService.validateTransactionInput(paymentTx);

    if (paymentTx.type !== "payment") {
      throw new ValidationError("Transaction must be of type 'payment'");
    }

    try {
      await this.db.withTransactionAsync(async () => {
        // Create payment transaction record
        const paymentId = generateId("txn");
        const paymentTransaction: Transaction = {
          id: paymentId,
          customerId: paymentTx.customerId,
          productId: paymentTx.productId,
          amount: paymentTx.amount,
          description: paymentTx.description || undefined,
          date: paymentTx.date,
          type: "payment",
          paymentMethod: paymentTx.paymentMethod || "cash",
          paidAmount: paymentTx.amount,
          remainingAmount: 0,
          status: "completed",
          linkedTransactionId: paymentTx.linkedTransactionId,
          appliedToDebt: paymentTx.appliedToDebt,
          dueDate: paymentTx.dueDate,
          currency: paymentTx.currency || "NGN",
          exchangeRate: paymentTx.exchangeRate || 1,
          metadata: paymentTx.metadata,
          isDeleted: false,
        };

        await this.db.runAsync(
          `INSERT INTO transactions (id, customerId, productId, amount, description, date, type, paymentMethod, paidAmount, remainingAmount, status, linkedTransactionId, appliedToDebt, dueDate, currency, exchangeRate, metadata, isDeleted) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            paymentTransaction.id,
            paymentTransaction.customerId,
            paymentTransaction.productId || null,
            paymentTransaction.amount,
            paymentTransaction.description || null,
            paymentTransaction.date,
            paymentTransaction.type,
            paymentTransaction.paymentMethod || "cash",
            paymentTransaction.paidAmount || paymentTransaction.amount,
            paymentTransaction.remainingAmount || 0,
            paymentTransaction.status || "completed",
            paymentTransaction.linkedTransactionId || null,
            paymentTransaction.appliedToDebt ? 1 : 0,
            paymentTransaction.dueDate || null,
            paymentTransaction.currency || "NGN",
            paymentTransaction.exchangeRate || 1,
            paymentTransaction.metadata || null,
            paymentTransaction.isDeleted ? 1 : 0,
          ]
        );

        await this.auditService.logEntry({
          tableName: "transactions",
          operation: "CREATE",
          recordId: paymentTransaction.id,
          newValues: paymentTransaction,
        });

        // Delegate allocation to PaymentService when available
        if (this.paymentService) {
          try {
            await this.paymentService.handlePaymentAllocation(
              paymentTx.customerId,
              paymentTransaction.id,
              paymentTx.amount,
              true // withinExistingTransaction = true
            );
          } catch (error) {
            console.warn(
              "PaymentService allocation failed, using fallback:",
              error
            );
            // Fallback to old method: allocate to outstanding debts
            await this.fallbackPaymentAllocation(
              paymentTx.customerId,
              paymentTransaction.id,
              paymentTx.amount,
              applyToOldest
            );
          }
        } else {
          // Fallback to old method: allocate to outstanding debts
          await this.fallbackPaymentAllocation(
            paymentTx.customerId,
            paymentTransaction.id,
            paymentTx.amount,
            applyToOldest
          );
        }

        // Ensure customer totals are updated after allocation
        await this.customerRepo.updateTotals([paymentTx.customerId]);
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("applyPaymentToDebt", error as Error);
    }
  }

  /**
   * Fallback payment allocation method when PaymentService is not available
   */
  private async fallbackPaymentAllocation(
    customerId: string,
    paymentId: string,
    amount: number,
    applyToOldest: boolean = true
  ): Promise<void> {
    // Get outstanding debts ordered by date
    const outstandingDebts = await this.db.getAllAsync<{
      id: string;
      remainingAmount: number;
      date: string;
    }>(
      `SELECT id, remainingAmount, date FROM transactions 
       WHERE customerId = ? AND type IN ('sale', 'credit') 
       AND remainingAmount > 0 AND isDeleted = 0 
       ORDER BY date ${applyToOldest ? "ASC" : "DESC"}`,
      [customerId]
    );

    let remainingToAllocate = amount;

    for (const debt of outstandingDebts) {
      if (remainingToAllocate <= 0) break;

      const allocateAmount = Math.min(
        remainingToAllocate,
        debt.remainingAmount
      );

      await this.db.runAsync(
        `UPDATE transactions 
         SET remainingAmount = remainingAmount - ?, 
             status = CASE WHEN remainingAmount - ? = 0 THEN 'completed' ELSE 'partial' END 
         WHERE id = ?`,
        [allocateAmount, allocateAmount, debt.id]
      );

      await this.auditService.logEntry({
        tableName: "transactions",
        operation: "UPDATE",
        recordId: debt.id,
        newValues: {
          allocatedPayment: allocateAmount,
          paymentId: paymentId,
        },
      });

      remainingToAllocate -= allocateAmount;
    }

    // Update customer's outstanding balance
    const allocatedAmount = amount - remainingToAllocate;
    if (allocatedAmount > 0) {
      await this.customerRepo.decreaseOutstandingBalance(
        customerId,
        allocatedAmount
      );
    }
  }

  /**
   * Handle debt management logic within a transaction context
   * (updates customers table directly for atomic operations)
   */
  private async handleDebtManagementInTransaction(
    transaction: Transaction
  ): Promise<void> {
    const debtAmount = transaction.remainingAmount || 0;

    switch (transaction.type) {
      case "sale":
        // Update total spent for all sales
        await this.db.runAsync(
          `UPDATE customers SET totalSpent = totalSpent + ?, updatedAt = ? WHERE id = ?`,
          [transaction.amount, new Date().toISOString(), transaction.customerId]
        );

        if (
          (transaction.paymentMethod === "credit" ||
            transaction.paymentMethod === "mixed") &&
          debtAmount > 0
        ) {
          // For credit/mixed payments, increase outstanding balance
          await this.db.runAsync(
            `UPDATE customers SET outstandingBalance = outstandingBalance + ?, updatedAt = ? WHERE id = ?`,
            [debtAmount, new Date().toISOString(), transaction.customerId]
          );
        }
        break;

      case "payment":
        // Payment received: use PaymentService to handle allocation only if appliedToDebt is true
        if (this.paymentService && transaction.appliedToDebt) {
          try {
            // Use PaymentService to handle proper payment allocation
            await this.paymentService.handlePaymentAllocation(
              transaction.customerId,
              transaction.id,
              transaction.amount,
              true // withinExistingTransaction = true
            );
          } catch (error) {
            console.warn(
              "PaymentService allocation failed, using fallback:",
              error
            );
            // Fallback to old method if PaymentService fails
            await this.db.runAsync(
              `UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?), updatedAt = ? WHERE id = ?`,
              [
                transaction.amount,
                new Date().toISOString(),
                transaction.customerId,
              ]
            );
          }
        } else if (transaction.appliedToDebt) {
          // Fallback to old method if PaymentService not available but appliedToDebt is true
          await this.db.runAsync(
            `UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?), updatedAt = ? WHERE id = ?`,
            [
              transaction.amount,
              new Date().toISOString(),
              transaction.customerId,
            ]
          );
        }
        // If appliedToDebt is false, don't reduce outstanding balance (future service deposit)
        break;

      case "credit":
        // Credit/loan issued: increase customer's outstanding balance by the full amount
        // Since credit transactions have paidAmount = 0 and remainingAmount = amount
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = outstandingBalance + ?, updatedAt = ? WHERE id = ?`,
          [transaction.amount, new Date().toISOString(), transaction.customerId]
        );
        break;

      case "refund":
        // Refund: decrease customer's outstanding balance
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?), updatedAt = ? WHERE id = ?`,
          [transaction.amount, new Date().toISOString(), transaction.customerId]
        );
        break;
    }
  }

  /**
   * Handle debt management updates when transaction is modified (non-transactional)
   */
  private async handleDebtUpdate(
    oldTx: Transaction,
    newTx: Transaction
  ): Promise<void> {
    const oldDebtChange = this.calculateDebtChange(oldTx);
    const newDebtChange = this.calculateDebtChange(newTx);
    const debtDifference = newDebtChange - oldDebtChange;

    if (debtDifference !== 0) {
      if (debtDifference > 0) {
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = outstandingBalance + ?, updatedAt = ? WHERE id = ?`,
          [debtDifference, new Date().toISOString(), newTx.customerId]
        );
      } else {
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?), updatedAt = ? WHERE id = ?`,
          [Math.abs(debtDifference), new Date().toISOString(), newTx.customerId]
        );
      }
    }
  }

  /**
   * Handle debt management updates within a transaction context
   */
  private async handleDebtUpdateInTransaction(
    oldTx: Transaction,
    newTx: Transaction
  ): Promise<void> {
    const oldDebtChange = this.calculateDebtChange(oldTx);
    const newDebtChange = this.calculateDebtChange(newTx);
    const debtDifference = newDebtChange - oldDebtChange;

    if (debtDifference !== 0) {
      if (debtDifference > 0) {
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = outstandingBalance + ?, updatedAt = ? WHERE id = ?`,
          [debtDifference, new Date().toISOString(), newTx.customerId]
        );
      } else {
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?), updatedAt = ? WHERE id = ?`,
          [Math.abs(debtDifference), new Date().toISOString(), newTx.customerId]
        );
      }
    }
  }

  /**
   * Calculate the debt impact of a transaction
   */
  private calculateDebtChange(transaction: Transaction): number {
    switch (transaction.type) {
      case "sale":
      case "credit":
        return transaction.remainingAmount || 0;
      case "payment":
      case "refund":
        return -transaction.amount;
      default:
        return 0;
    }
  }

  // ===== TEST COMPATIBILITY METHODS =====

  /**
   * Update transaction status - for test compatibility
   */
  async updateStatus(transactionId: string, newStatus: string): Promise<void> {
    if (!transactionId?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    try {
      await this.db.runAsync(
        "UPDATE transactions SET status = ?, updatedAt = ? WHERE id = ?",
        [newStatus, new Date().toISOString(), transactionId]
      );

      await this.auditService.logEntry({
        tableName: "transactions",
        operation: "UPDATE",
        recordId: transactionId,
        newValues: { status: newStatus },
      });
    } catch (error) {
      throw new DatabaseError("updateStatus", error as Error);
    }
  }

  /**
   * Get transactions by customer - for test compatibility
   */
  async getByCustomer(customerId: string): Promise<Transaction[]> {
    return this.findByCustomer(customerId);
  }

  /**
   * Get all transactions - for test compatibility
   */
  async getAll(): Promise<Transaction[]> {
    return this.getAllTransactions();
  }

  /**
   * Create transaction - for test compatibility
   */
  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    return this.create(data);
  }

  /**
   * Create transaction with balance handling - for test compatibility
   */
  async createWithBalance(data: CreateTransactionInput): Promise<Transaction> {
    return this.create(data);
  }
}
