
-- Create tables
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  totalSpent INTEGER DEFAULT 0,
  outstandingBalance INTEGER DEFAULT 0,
  creditBalance INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL,
  productId TEXT,
  amount INTEGER NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  paymentMethod TEXT,
  paidAmount INTEGER DEFAULT 0,
  remainingAmount INTEGER DEFAULT 0,
  status TEXT,
  linkedTransactionId TEXT,
  appliedToDebt INTEGER DEFAULT 0,
  dueDate TEXT,
  currency TEXT DEFAULT 'NGN',
  exchangeRate REAL DEFAULT 1,
  metadata TEXT,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert test customers
INSERT INTO customers (id, name, phone, email, totalSpent, outstandingBalance, creditBalance, createdAt, updatedAt) VALUES
('cust_001', 'John Doe', '+2348012345678', 'john@example.com', 500000, 400000, 0, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('cust_002', 'Jane Smith', '+2348087654321', 'jane@example.com', 750000, 200000, 50000, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('cust_003', 'Mike Johnson', '+2348098765432', 'mike@example.com', 300000, 300000, 0, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');

-- Insert test transactions that will create balance discrepancies
-- Customer 1: Should owe ₦6,000 but stored balance shows ₦4,000
INSERT INTO transactions (id, customerId, amount, description, date, type, paymentMethod, paidAmount, remainingAmount, status, appliedToDebt, isDeleted) VALUES
('txn_001', 'cust_001', 300000, 'Sale - Product A', '2024-01-01T10:00:00Z', 'sale', 'credit', 0, 300000, 'pending', 0, 0),
('txn_002', 'cust_001', 200000, 'Sale - Product B', '2024-01-02T10:00:00Z', 'sale', 'credit', 0, 200000, 'pending', 0, 0),
('txn_003', 'cust_001', 100000, 'Payment received', '2024-01-03T10:00:00Z', 'payment', 'cash', 100000, 0, 'completed', 1, 0);

-- Customer 2: Balanced transactions
INSERT INTO transactions (id, customerId, amount, description, date, type, paymentMethod, paidAmount, remainingAmount, status, appliedToDebt, isDeleted) VALUES
('txn_004', 'cust_002', 400000, 'Sale - Service A', '2024-01-01T11:00:00Z', 'sale', 'credit', 0, 400000, 'pending', 0, 0),
('txn_005', 'cust_002', 200000, 'Payment received', '2024-01-02T11:00:00Z', 'payment', 'cash', 200000, 0, 'completed', 1, 0),
('txn_006', 'cust_002', 150000, 'Overpayment', '2024-01-03T11:00:00Z', 'payment', 'cash', 150000, 0, 'completed', 1, 0);

-- Customer 3: Exact balance match
INSERT INTO transactions (id, customerId, amount, description, date, type, paymentMethod, paidAmount, remainingAmount, status, appliedToDebt, isDeleted) VALUES
('txn_007', 'cust_003', 300000, 'Sale - Product C', '2024-01-01T12:00:00Z', 'sale', 'credit', 0, 300000, 'pending', 0, 0);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_customerId ON transactions(customerId);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_customers_outstanding ON customers(outstandingBalance);
