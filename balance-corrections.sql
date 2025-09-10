-- Klyntl Database Balance Correction Script
-- Generated on: 2025-09-09T13:38:53.708Z
-- This script fixes balance discrepancies found in the exported database

BEGIN TRANSACTION;

-- Update A Z Akube (cust_1757423505403_e3cq3my)
UPDATE customers SET
  outstandingBalance = 6000,
  credit_balance = 0,
  updatedAt = '2025-09-09T13:38:53.708Z'
WHERE id = 'cust_1757423505403_e3cq3my';

-- Update A.Z Mcan Ipokia (cust_1757423505406_qz9dhu4)
UPDATE customers SET
  outstandingBalance = 0,
  credit_balance = 1000,
  updatedAt = '2025-09-09T13:38:53.708Z'
WHERE id = 'cust_1757423505406_qz9dhu4';

COMMIT;

-- Verification queries:
SELECT 'Outstanding Balance Total' as check_type, SUM(outstandingBalance) as total FROM customers;
SELECT 'Credit Balance Total' as check_type, SUM(credit_balance) as total FROM customers;