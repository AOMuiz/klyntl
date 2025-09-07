import { migrations } from "../migrations";

// Minimal mock DB implementing only methods used by migration
class MockDb {
  private tables: Record<string, any[]> = {};

  constructor() {
    // seed customers and transactions tables
    this.tables["customers"] = [
      {
        id: "cust_1",
        outstandingBalance: 0,
        updatedAt: new Date().toISOString(),
      },
    ];

    this.tables["transactions"] = [
      {
        id: "txn_debt",
        customerId: "cust_1",
        type: "credit",
        amount: 5000,
        remainingAmount: 5000,
        paidAmount: 0,
        isDeleted: 0,
      },
      {
        id: "txn_payment",
        customerId: "cust_1",
        type: "payment",
        amount: 5000,
        remainingAmount: 0,
        paidAmount: 5000,
        appliedToDebt: 1,
      },
    ];

    this.tables["payment_audit"] = [];
  }

  async getAllAsync<T = any>(sql: string, params?: any): Promise<T[]> {
    // very naive SQL parsing for test purposes
    if (sql.includes("SELECT id FROM customers")) {
      return this.tables["customers"] as any;
    }

    if (sql.includes("SELECT COALESCE(SUM(remainingAmount)")) {
      const customerId = params ? params[0] : undefined;
      const sum = this.tables["transactions"]
        .filter(
          (t) =>
            t.customerId === customerId &&
            ["sale", "credit"].includes(t.type) &&
            t.isDeleted === 0
        )
        .reduce((s, t) => s + (t.remainingAmount || 0), 0);
      return [{ outstanding: sum }] as any;
    }

    return [] as any;
  }

  async getFirstAsync<T = any>(
    sql: string,
    params?: any
  ): Promise<T | undefined> {
    if (sql.includes("PRAGMA user_version")) {
      return { user_version: 9 } as any; // simulate version 9 to ensure migration 10 runs
    }

    if (sql.includes("SELECT COALESCE(SUM(remainingAmount)")) {
      const customerId = params ? params[0] : undefined;
      const sum = this.tables["transactions"]
        .filter(
          (t) =>
            t.customerId === customerId &&
            ["sale", "credit"].includes(t.type) &&
            t.isDeleted === 0
        )
        .reduce((s, t) => s + (t.remainingAmount || 0), 0);
      return { outstanding: sum } as any;
    }

    return undefined;
  }

  async runAsync(sql: string, params?: any): Promise<any> {
    // Handle updates and inserts we expect
    if (sql.startsWith("UPDATE transactions")) {
      // no-op for test
      return { changes: 1 };
    }

    if (sql.includes("INSERT INTO payment_audit")) {
      // push a synthetic audit record
      this.tables["payment_audit"].push({ id: `audit_${Math.random()}` });
      return { changes: 1 };
    }

    if (sql.includes("UPDATE customers SET outstandingBalance")) {
      const [outstanding, updatedAt, id] = params || [];
      const c = this.tables["customers"].find((x) => x.id === id);
      if (c) {
        c.outstandingBalance = outstanding;
        c.updatedAt = updatedAt;
      }
      return { changes: 1 };
    }

    return { changes: 0 };
  }

  async withTransactionAsync(callback: Function) {
    return await callback();
  }
}

describe("migration010 reconciliation", () => {
  it("should recompute outstanding balances and insert legacy audits", async () => {
    const mockDb: any = new MockDb();

    // find migration 10
    const mig = migrations.find((m) => m.version === 10);
    expect(mig).toBeDefined();

    await mig!.up(mockDb);

    // verify customer outstanding updated
    const customers: any = await mockDb.getAllAsync("SELECT id FROM customers");
    expect(customers[0].outstandingBalance).toBe(5000);

    // verify legacy audit inserted
    const audits = (mockDb as any).tables["payment_audit"];
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });
});
