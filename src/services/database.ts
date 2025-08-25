import * as SQLite from "expo-sqlite";
import { Analytics } from "../types/analytics";
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../types/customer";
import { CreateTransactionInput, Transaction } from "../types/transaction";

export class DatabaseService {
  private db: SQLite.WebSQLDatabase;
  private isInitialized = false;

  constructor(databaseName = "klyntl.db") {
    this.db = SQLite.openDatabase(databaseName);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          // Customers table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS customers (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              phone TEXT UNIQUE NOT NULL,
              email TEXT,
              address TEXT,
              totalSpent REAL DEFAULT 0,
              lastPurchase TEXT,
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL
            );
          `);

          // Transactions table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              customerId TEXT NOT NULL,
              amount REAL NOT NULL,
              description TEXT,
              date TEXT NOT NULL,
              type TEXT NOT NULL,
              FOREIGN KEY (customerId) REFERENCES customers (id)
            );
          `);

          // Create indexes for performance
          tx.executeSql(
            "CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);"
          );
          tx.executeSql(
            "CREATE INDEX IF NOT EXISTS idx_customer_name ON customers(name);"
          );
          tx.executeSql(
            "CREATE INDEX IF NOT EXISTS idx_transaction_customer ON transactions(customerId);"
          );
          tx.executeSql(
            "CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);"
          );
        },
        (error) => {
          console.error("Database initialization failed:", error);
          reject(error);
        },
        () => {
          this.isInitialized = true;
          resolve();
        }
      );
    });
  }

  async createCustomer(customerInput: CreateCustomerInput): Promise<Customer> {
    await this.initialize();

    const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const customer: Customer = {
      ...customerInput,
      id,
      totalSpent: 0,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO customers (id, name, phone, email, address, totalSpent, lastPurchase, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            customer.id,
            customer.name,
            customer.phone,
            customer.email || null,
            customer.address || null,
            customer.totalSpent,
            customer.lastPurchase || null,
            customer.createdAt,
            customer.updatedAt,
          ],
          () => resolve(customer),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM customers ORDER BY name ASC";
      let params: any[] = [];

      if (searchQuery) {
        sql =
          "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC";
        params = [`%${searchQuery}%`, `%${searchQuery}%`];
      }

      this.db.transaction((tx) => {
        tx.executeSql(
          sql,
          params,
          (_, { rows }) => {
            const customers: Customer[] = [];
            for (let i = 0; i < rows.length; i++) {
              customers.push(rows.item(i));
            }
            resolve(customers);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM customers WHERE id = ?",
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0));
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async updateCustomer(
    id: string,
    updates: UpdateCustomerInput
  ): Promise<void> {
    await this.initialize();

    const updatedAt = new Date().toISOString();
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), updatedAt, id];

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `UPDATE customers SET ${setClause}, updatedAt = ? WHERE id = ?`,
          values,
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        // First delete all transactions for this customer
        tx.executeSql(
          "DELETE FROM transactions WHERE customerId = ?",
          [id],
          () => {
            // Then delete the customer
            tx.executeSql(
              "DELETE FROM customers WHERE id = ?",
              [id],
              () => resolve(),
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async createTransaction(
    transactionInput: CreateTransactionInput
  ): Promise<Transaction> {
    await this.initialize();

    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction: Transaction = { ...transactionInput, id };

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        // Insert transaction
        tx.executeSql(
          "INSERT INTO transactions (id, customerId, amount, description, date, type) VALUES (?, ?, ?, ?, ?, ?)",
          [
            transaction.id,
            transaction.customerId,
            transaction.amount,
            transaction.description || null,
            transaction.date,
            transaction.type,
          ],
          () => {
            // Update customer total spent if it's a sale
            if (transaction.type === "sale") {
              tx.executeSql(
                "UPDATE customers SET totalSpent = totalSpent + ?, lastPurchase = ? WHERE id = ?",
                [transaction.amount, transaction.date, transaction.customerId]
              );
            }
            resolve(transaction);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getTransactions(customerId?: string): Promise<Transaction[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM transactions ORDER BY date DESC";
      let params: any[] = [];

      if (customerId) {
        sql =
          "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC";
        params = [customerId];
      }

      this.db.transaction((tx) => {
        tx.executeSql(
          sql,
          params,
          (_, { rows }) => {
            const transactions: Transaction[] = [];
            for (let i = 0; i < rows.length; i++) {
              transactions.push(rows.item(i));
            }
            resolve(transactions);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getAnalytics(): Promise<Analytics> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        // Get total customers
        tx.executeSql(
          "SELECT COUNT(*) as count FROM customers",
          [],
          (_, { rows }) => {
            const totalCustomers = rows.item(0).count;

            // Get total revenue and transactions
            tx.executeSql(
              'SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE type = "sale"',
              [],
              (_, { rows }) => {
                const totalTransactions = rows.item(0).count || 0;
                const totalRevenue = rows.item(0).total || 0;

                // Get top customers
                tx.executeSql(
                  "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 5",
                  [],
                  (_, { rows }) => {
                    const topCustomers: Customer[] = [];
                    for (let i = 0; i < rows.length; i++) {
                      topCustomers.push(rows.item(i));
                    }

                    resolve({
                      totalCustomers,
                      totalRevenue,
                      totalTransactions,
                      topCustomers,
                    });
                  },
                  (_, error) => {
                    reject(error);
                    return false;
                  }
                );
              },
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // For testing purposes
  async clearAllData(): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql("DELETE FROM transactions");
          tx.executeSql("DELETE FROM customers");
        },
        (error) => reject(error),
        () => resolve()
      );
    });
  }
}

export const databaseService = new DatabaseService();
