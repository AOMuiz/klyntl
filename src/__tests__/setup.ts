/**
 * Jest test setup file
 * This file is automatically run before each test
 */

import "react-native-gesture-handler/jestSetup";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Reanimated = require("react-native-reanimated/mock");

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});

// Mock expo-sqlite with the new async API and stateful storage
jest.mock("expo-sqlite", () => {
  // In-memory storage for mock database
  const mockDatabases = new Map();

  const createMockDb = (dbName: string) => {
    if (mockDatabases.has(dbName)) {
      return mockDatabases.get(dbName);
    }

    // Simple in-memory storage
    const tables = new Map();
    let nextRowId = 1;

    // Initialize common tables that services expect
    const initializeTables = () => {
      // Create customers table
      if (!tables.has("customers")) {
        tables.set("customers", []);
      }
      // Create transactions table
      if (!tables.has("transactions")) {
        tables.set("transactions", []);
      }
      // Create simple_payment_audit table
      if (!tables.has("simple_payment_audit")) {
        tables.set("simple_payment_audit", []);
      }
      // Create payment_audit table
      if (!tables.has("payment_audit")) {
        tables.set("payment_audit", []);
      }
    };

    initializeTables();

    const mockDb: any = {
      runAsync: jest.fn(async (sql: string, params: any[] = []) => {
        const sqlLower = sql.toLowerCase().trim();

        // Handle CREATE TABLE
        if (sqlLower.startsWith("create table")) {
          const tableMatch = sql.match(
            /create table (?:if not exists )?([^\s(]+)/i
          );
          if (tableMatch) {
            const tableName = tableMatch[1];
            if (!tables.has(tableName)) {
              tables.set(tableName, []);
            }
          }
          return { changes: 0, lastInsertRowId: 0 };
        }

        // Handle CREATE INDEX
        if (sqlLower.startsWith("create index")) {
          return { changes: 0, lastInsertRowId: 0 };
        }

        // Handle PRAGMA
        if (sqlLower.startsWith("pragma")) {
          return { changes: 0, lastInsertRowId: 0 };
        }

        // Handle INSERT
        if (sqlLower.startsWith("insert into")) {
          const tableMatch = sql.match(/insert into ([^\s(]+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            if (!tables.has(tableName)) {
              tables.set(tableName, []);
            }

            // Extract column names from SQL
            const columnsMatch = sql.match(/\(([^)]+)\)/);
            const valuesMatch = sql.match(/values\s*\(([^)]+)\)/i);

            if (columnsMatch && valuesMatch) {
              const columns = columnsMatch[1].split(",").map((c) => c.trim());
              const row: any = {};

              // Map parameters to columns
              columns.forEach((col, index) => {
                row[col] = params[index];
              });

              tables.get(tableName).push(row);

              // If this is a transaction, update customer totals
              if (tableName === "transactions" && row.type === "sale") {
                const customersTable = tables.get("customers");
                if (customersTable) {
                  const customer = customersTable.find(
                    (c: any) => c.id === row.customerId
                  );
                  if (customer) {
                    customer.totalSpent =
                      (customer.totalSpent || 0) +
                      (parseFloat(row.amount) || 0);
                    customer.lastPurchase = row.date;
                  }
                }
              }

              // If this is simple_payment_audit, store the audit record
              if (tableName === "simple_payment_audit") {
                // The columns are: id, customer_id, type, amount, created_at, description
                // Map them from the params
                const auditRow = {
                  id: params[0],
                  customer_id: params[1],
                  type: params[2],
                  amount: params[3],
                  created_at: params[4],
                  description: params[5],
                };
                tables.get(tableName).push(auditRow);
              }

              return { changes: 1, lastInsertRowId: nextRowId++ };
            }
          }
          return { changes: 1, lastInsertRowId: nextRowId++ };
        }

        // Handle UPDATE
        if (sqlLower.startsWith("update")) {
          const tableMatch = sql.match(/update ([^\s]+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            if (tables.has(tableName)) {
              // Handle customer total updates specifically
              if (tableName === "customers" && sql.includes("totalSpent = ?")) {
                const idMatch = sql.match(/where id = \?/i);
                if (idMatch && params.length >= 3) {
                  const customerId = params[params.length - 1]; // Last param is usually the ID
                  const customersTable = tables.get("customers");
                  if (customersTable) {
                    const customer = customersTable.find(
                      (c: any) => c.id === customerId
                    );
                    if (customer) {
                      customer.totalSpent = params[0]; // First param is usually totalSpent
                      customer.lastPurchase = params[1]; // Second param is usually lastPurchase
                      customer.updatedAt = params[2]; // Third param is usually updatedAt
                    }
                  }
                }
              }

              // Handle general customer updates
              if (
                tableName === "customers" &&
                !sql.includes("totalSpent = ?")
              ) {
                const idMatch = sql.match(/where id = \?/i);
                if (idMatch && params.length >= 1) {
                  const customerId = params[params.length - 1]; // Last param is the ID
                  const customersTable = tables.get("customers");
                  if (customersTable) {
                    const customer = customersTable.find(
                      (c: any) => c.id === customerId
                    );
                    if (customer) {
                      // Parse SET clause to update specific fields
                      const setClause = sql.match(/SET (.+) WHERE/i)?.[1];
                      if (setClause) {
                        const assignments = setClause.split(",");
                        assignments.forEach((assignment, index) => {
                          const fieldMatch = assignment
                            .trim()
                            .match(/(\w+)\s*=\s*\?/);
                          if (fieldMatch && index < params.length - 1) {
                            const fieldName = fieldMatch[1];
                            customer[fieldName] = params[index];
                          }
                        });
                        customer.updatedAt = new Date().toISOString();
                      }
                    }
                  }
                }
              }

              return { changes: 1, lastInsertRowId: 0 };
            }
          }
          return { changes: 0, lastInsertRowId: 0 };
        }

        // Handle DELETE
        if (sqlLower.startsWith("delete")) {
          const tableMatch = sql.match(/delete from ([^\s]+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            if (tables.has(tableName)) {
              const table = tables.get(tableName);
              // Handle specific DELETE with WHERE clause
              if (sql.includes("WHERE id = ?") && params.length > 0) {
                const id = params[0];
                const filteredTable = table.filter((row: any) => row.id !== id);
                tables.set(tableName, filteredTable);
                return {
                  changes: table.length - filteredTable.length,
                  lastInsertRowId: 0,
                };
              }
              // Handle DELETE ALL
              tables.set(tableName, []);
              return { changes: table.length, lastInsertRowId: 0 };
            }
          }
          return { changes: 0, lastInsertRowId: 0 };
        }

        return { changes: 0, lastInsertRowId: 0 };
      }),

      getAllAsync: jest.fn(async (sql: string, params: any[] = []) => {
        const sqlLower = sql.toLowerCase().trim();

        // Handle PRAGMA table_info
        if (sqlLower.includes("pragma table_info")) {
          const tableMatch = sql.match(/pragma table_info\(([^)]+)\)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            if (tables.has(tableName)) {
              // Return mock column info
              return [
                { name: "id", type: "TEXT" },
                { name: "name", type: "TEXT" },
                { name: "phone", type: "TEXT" },
                { name: "email", type: "TEXT" },
                { name: "address", type: "TEXT" },
                { name: "company", type: "TEXT" },
                { name: "totalSpent", type: "REAL" },
                { name: "createdAt", type: "TEXT" },
                { name: "updatedAt", type: "TEXT" },
              ];
            }
          }
          return [];
        }

        // Handle SELECT queries
        if (sqlLower.startsWith("select")) {
          const tableMatch = sql.match(/from ([^\s]+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            if (tables.has(tableName)) {
              let results = [...tables.get(tableName)];

              // Handle SUM queries for transaction aggregation
              if (sql.includes("SUM(amount)")) {
                const customersTable = tables.get("customers");
                const transactionsTable = tables.get("transactions");

                if (customersTable && transactionsTable) {
                  // Update customer totals based on transactions
                  customersTable.forEach((customer: any) => {
                    const customerTransactions = transactionsTable.filter(
                      (t: any) =>
                        t.customerId === customer.id && t.type === "sale"
                    );
                    customer.totalSpent = customerTransactions.reduce(
                      (sum: number, t: any) =>
                        sum + (parseFloat(t.amount) || 0),
                      0
                    );

                    if (customerTransactions.length > 0) {
                      customer.lastPurchase = customerTransactions.sort(
                        (a: any, b: any) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )[0].date;
                    }
                  });
                }

                // Return aggregated result for SUM queries
                if (sql.includes("WHERE customerId = ?") && params.length > 0) {
                  const customerId = params[0];
                  const customerTransactions =
                    transactionsTable?.filter(
                      (t: any) =>
                        t.customerId === customerId && t.type === "sale"
                    ) || [];
                  const total = customerTransactions.reduce(
                    (sum: number, t: any) => sum + (parseFloat(t.amount) || 0),
                    0
                  );
                  return [{ total }];
                }
              }

              // Handle simple_payment_audit queries
              if (tableName === "simple_payment_audit") {
                let auditResults = [...tables.get("simple_payment_audit")];

                // Apply WHERE conditions for audit queries
                if (
                  sql.includes("WHERE customer_id = ?") &&
                  params.length > 0
                ) {
                  auditResults = auditResults.filter(
                    (row: any) => row.customer_id === params[0]
                  );
                }

                // Apply ORDER BY for audit queries
                if (sql.toLowerCase().includes("order by created_at desc")) {
                  auditResults.sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  );
                }

                // Apply LIMIT for audit queries
                if (
                  sql.toLowerCase().includes("limit ?") &&
                  params.length > 1
                ) {
                  const limit = params[params.length - 1];
                  auditResults = auditResults.slice(0, limit);
                }

                return auditResults;
              }

              // Apply WHERE conditions (simplified)
              if (sql.toLowerCase().includes("where")) {
                // For business customers
                if (sql.includes("company IS NOT NULL AND company != ''")) {
                  results = results.filter(
                    (row) => row.company && row.company !== ""
                  );
                }
                // For individual customers
                if (sql.includes("company IS NULL OR company = ''")) {
                  results = results.filter(
                    (row) => !row.company || row.company === ""
                  );
                }
                // For spending range with params
                if (sql.includes("totalSpent >=") && params.length > 0) {
                  // Find the index of the totalSpent parameter
                  let paramIndex = 0;
                  if (
                    sql.includes("company IS NOT NULL") ||
                    sql.includes("company IS NULL")
                  ) {
                    paramIndex = params.findIndex((p) => typeof p === "number");
                  }
                  if (paramIndex >= 0 && paramIndex < params.length) {
                    const min = parseFloat(params[paramIndex]);
                    results = results.filter(
                      (row) => (row.totalSpent || 0) >= min
                    );
                  }
                }
                // For spending range
                if (sql.includes("totalSpent >=")) {
                  const minMatch = sql.match(/totalSpent >= ([0-9.]+)/);
                  if (minMatch) {
                    const min = parseFloat(minMatch[1]);
                    results = results.filter(
                      (row) => (row.totalSpent || 0) >= min
                    );
                  }
                }
                // For transaction status
                if (sql.includes("totalSpent > 0")) {
                  results = results.filter((row) => (row.totalSpent || 0) > 0);
                }
                if (sql.includes("totalSpent = 0")) {
                  results = results.filter(
                    (row) => (row.totalSpent || 0) === 0
                  );
                }
                // For contact source
                if (sql.includes("contactSource = ?") && params.length > 0) {
                  const contactSource = params[params.length - 1];
                  results = results.filter(
                    (row) => row.contactSource === contactSource
                  );
                }
                // For ID match
                if (sql.includes("id = ?") && params.length > 0) {
                  results = results.filter((row) => row.id === params[0]);
                }
                // For search queries
                if (
                  sql.includes(
                    "name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?"
                  )
                ) {
                  const searchTerm = params[0]?.replace(/%/g, "") || "";
                  results = results.filter(
                    (row) =>
                      (row.name &&
                        row.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())) ||
                      (row.phone && row.phone.includes(searchTerm)) ||
                      (row.email &&
                        row.email
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())) ||
                      (row.company &&
                        row.company
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()))
                  );
                }
              }

              // Apply ORDER BY (simplified)
              if (sql.toLowerCase().includes("order by name")) {
                results.sort((a, b) =>
                  (a.name || "").localeCompare(b.name || "")
                );
              }
              if (sql.toLowerCase().includes("order by totalspent desc")) {
                results.sort(
                  (a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)
                );
              }
              if (sql.toLowerCase().includes("order by totalspent asc")) {
                results.sort(
                  (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0)
                );
              }

              return results;
            }
          }
        }

        return [];
      }),

      getFirstAsync: jest.fn(
        async (sql: string, params: any[] = []): Promise<any> => {
          const results: any[] = await mockDb.getAllAsync(sql, params);
          return results.length > 0 ? results[0] : null;
        }
      ),

      withTransactionAsync: jest.fn(async (callback: () => Promise<any>) => {
        return await callback();
      }),

      closeAsync: jest.fn(() => Promise.resolve()),
    };

    mockDatabases.set(dbName, mockDb);
    return mockDb;
  };

  return {
    openDatabaseAsync: jest.fn((dbName: string) =>
      Promise.resolve(createMockDb(dbName))
    ),
    // Keep the old openDatabase for backward compatibility
    openDatabase: jest.fn(() => ({
      transaction: jest.fn((callback: any) => {
        const tx = {
          executeSql: jest.fn(
            (sql: any, params: any, success: any, error: any) => {
              // Mock successful database operations
              if (sql.startsWith("CREATE TABLE")) {
                success();
              } else if (sql.startsWith("INSERT")) {
                success({ insertId: 1 });
              } else if (sql.startsWith("UPDATE")) {
                success({ rowsAffected: 1 });
              } else if (sql.startsWith("DELETE")) {
                success({ rowsAffected: 1 });
              } else {
                error("SQL error");
              }
            }
          ),
        };
        callback(tx);
      }),
    })),
  };
});
