import { generateId } from "@/utils/helpers";
import { useSQLiteContext } from "expo-sqlite";

const DebugDatabase = () => {
  const db = useSQLiteContext();

  const checkDatabaseState = async () => {
    try {
      console.log("=== DATABASE DEBUG INFO ===");

      // Check current version
      const version =
        (await db.getFirstAsync) <
        { user_version: number } >
        "PRAGMA user_version";
      console.log("Database version:", version?.user_version || 0);

      // Check if payment_audit table exists
      const tables =
        (await db.getAllAsync) <
        { name: string } >
        "SELECT name FROM sqlite_master WHERE type='table' AND name='payment_audit'";
      console.log("Payment audit table exists:", tables.length > 0);

      // Check table structure
      if (tables.length > 0) {
        const columns =
          (await db.getAllAsync) <
          { name: string, type: string } >
          "PRAGMA table_info(payment_audit)";
        console.log("Payment audit columns:", columns);
      }

      // Check recent transactions
      const transactions = await db.getAllAsync(
        "SELECT id, type, amount, status, linkedTransactionId, appliedToDebt FROM transactions ORDER BY date DESC LIMIT 10"
      );
      console.log("Recent transactions:", transactions);

      // Check payment audit records
      const auditRecords = await db.getAllAsync(
        "SELECT id, type, amount, source_transaction_id, metadata FROM payment_audit ORDER BY created_at DESC LIMIT 10"
      );
      console.log("Recent audit records:", auditRecords);

      // Check customer balances
      const customers = await db.getAllAsync(
        "SELECT id, name, outstandingBalance, credit_balance FROM customers LIMIT 5"
      );
      console.log("Customer balances:", customers);
    } catch (error) {
      console.error("Database debug error:", error);
    }
  };

  const testPaymentAllocation = async () => {
    try {
      console.log("=== TESTING PAYMENT ALLOCATION ===");

      // Create a test customer
      const customerId = generateId("cust");
      await db.runAsync(
        "INSERT INTO customers (id, name, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
        [
          customerId,
          "Test Customer",
          "08012345678",
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
      console.log("Created test customer:", customerId);

      // Create a test sale transaction (debt)
      const saleId = generateId("txn");
      await db.runAsync(
        "INSERT INTO transactions (id, customerId, amount, description, date, type, paymentMethod, paidAmount, remainingAmount, status, appliedToDebt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          saleId,
          customerId,
          200000,
          "Test Sale",
          new Date().toISOString(),
          "sale",
          "credit",
          0,
          200000,
          "pending",
          0,
        ]
      );
      console.log("Created test sale:", saleId);

      // Create a test payment transaction
      const paymentId = generateId("txn");
      await db.runAsync(
        "INSERT INTO transactions (id, customerId, amount, description, date, type, paymentMethod, paidAmount, remainingAmount, status, appliedToDebt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          paymentId,
          customerId,
          100000,
          "Test Payment",
          new Date().toISOString(),
          "payment",
          "cash",
          100000,
          0,
          "completed",
          1,
        ]
      );
      console.log("Created test payment:", paymentId);

      // Check if PaymentService would be called (simulate the allocation)
      console.log("Simulating payment allocation...");

      // Get outstanding debts
      const debts = await db.getAllAsync(
        'SELECT id, remainingAmount FROM transactions WHERE customerId = ? AND type IN ("sale", "credit") AND remainingAmount > 0',
        [customerId]
      );
      console.log("Outstanding debts before allocation:", debts);

      // Simulate allocation
      if (debts.length > 0) {
        const debt = debts[0];
        const allocateAmount = Math.min(100000, debt.remainingAmount);
        const newRemaining = debt.remainingAmount - allocateAmount;

        await db.runAsync(
          "UPDATE transactions SET remainingAmount = ?, status = ? WHERE id = ?",
          [newRemaining, newRemaining === 0 ? "completed" : "partial", debt.id]
        );

        await db.runAsync(
          "UPDATE transactions SET linkedTransactionId = ? WHERE id = ?",
          [debt.id, paymentId]
        );

        // Create audit record
        const auditId = generateId("audit");
        await db.runAsync(
          "INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)",
          [
            auditId,
            customerId,
            paymentId,
            "payment_allocation",
            allocateAmount,
            JSON.stringify({ debtId: debt.id }),
          ]
        );

        console.log(
          "Allocation complete. Updated debt remaining:",
          newRemaining
        );
      }

      // Check final state
      const finalDebts = await db.getAllAsync(
        "SELECT id, remainingAmount, status FROM transactions WHERE customerId = ?",
        [customerId]
      );
      console.log("Final transaction states:", finalDebts);

      const finalAudits = await db.getAllAsync(
        "SELECT type, amount FROM payment_audit WHERE customer_id = ?",
        [customerId]
      );
      console.log("Final audit records:", finalAudits);
    } catch (error) {
      console.error("Payment allocation test error:", error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Database Debug Tools</h2>
      <button onClick={checkDatabaseState} style={{ margin: 10, padding: 10 }}>
        Check Database State
      </button>
      <button
        onClick={testPaymentAllocation}
        style={{ margin: 10, padding: 10 }}
      >
        Test Payment Allocation
      </button>
    </div>
  );
};

export default DebugDatabase;
