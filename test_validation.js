// Simple test for validation fixes
const { ValidationService } = require('./dist/services/database/service/ValidationService');

// Test cash payment validation
try {
  ValidationService.validateTransactionInput({
    amount: 1000,
    paidAmount: 1000,
    remainingAmount: 0,
    paymentMethod: 'cash'
  });
  console.log('✅ Cash payment validation passed');
} catch (error) {
  console.log('❌ Cash payment validation failed:', error.message);
}
