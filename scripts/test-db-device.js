/**
 * Database Device Testing Script
 *
 * This script helps create comprehensive database tests for real device testing
 */

const fs = require("fs");
const path = require("path");

// Create a device testing configuration
const deviceTestConfig = {
  // Test scenarios to run on device
  testScenarios: [
    "database_creation",
    "schema_migration",
    "transaction_performance",
    "concurrent_operations",
    "large_dataset_handling",
    "offline_sync",
    "memory_pressure",
    "device_rotation_handling",
    "background_app_state",
    "low_memory_conditions",
  ],

  // Performance benchmarks
  performanceThresholds: {
    maxTransactionTime: 1000, // ms
    maxMigrationTime: 5000, // ms
    maxQueryTime: 500, // ms
    maxBulkInsertTime: 2000, // ms for 1000 records
  },

  // Test data sizes
  testDataSizes: {
    small: 100,
    medium: 1000,
    large: 10000,
    xlarge: 50000,
  },
};

// Create device test helper
const deviceTestHelper = `
import * as SQLite from 'expo-sqlite';
import { createDatabaseService } from '@/services/database';
import { Customer } from '@/types/customer';
import { Transaction } from '@/types/transaction';

export class DeviceTestHelper {
  private db: SQLite.SQLiteDatabase | null = null;
  private databaseService: any = null;
  
  async initialize() {
    try {
      console.log('📱 Initializing device database test...');
      this.db = await SQLite.openDatabaseAsync('test_klyntl.db');
      this.databaseService = createDatabaseService(this.db);
      
      // Run initial setup
      await this.runMigrations();
      console.log('✅ Device test initialization complete');
      
      return true;
    } catch (error) {
      console.error('❌ Device test initialization failed:', error);
      return false;
    }
  }
  
  async runMigrations() {
    console.log('🔄 Running database migrations...');
    const startTime = Date.now();
    
    try {
      // Your migration logic here
      await this.databaseService.runMigrations();
      
      const duration = Date.now() - startTime;
      console.log(\`✅ Migrations completed in \${duration}ms\`);
      
      // Check if migration time is within acceptable limits
      if (duration > ${deviceTestConfig.performanceThresholds.maxMigrationTime}) {
        console.warn(\`⚠️ Migration took longer than expected: \${duration}ms\`);
      }
      
      return { success: true, duration };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async testDatabaseOperations() {
    console.log('🧪 Testing basic database operations...');
    const results = {};
    
    // Test customer creation
    results.customerCreation = await this.testCustomerCreation();
    
    // Test transaction creation
    results.transactionCreation = await this.testTransactionCreation();
    
    // Test bulk operations
    results.bulkOperations = await this.testBulkOperations();
    
    // Test query performance
    results.queryPerformance = await this.testQueryPerformance();
    
    return results;
  }
  
  async testCustomerCreation() {
    const startTime = Date.now();
    
    try {
      const customer = await this.databaseService.customers.create({
        name: 'Device Test Customer',
        phone: '+234' + Math.random().toString().substr(2, 10),
        email: \`test\${Date.now()}@device.test\`
      });
      
      const duration = Date.now() - startTime;
      console.log(\`✅ Customer created in \${duration}ms\`);
      
      return { success: true, duration, customerId: customer.id };
    } catch (error) {
      console.error('❌ Customer creation failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async testTransactionCreation() {
    const startTime = Date.now();
    
    try {
      // First create a customer for the transaction
      const customer = await this.databaseService.customers.create({
        name: 'Transaction Test Customer',
        phone: '+234' + Math.random().toString().substr(2, 10)
      });
      
      const transaction = await this.databaseService.transactions.create({
        customerId: customer.id,
        amount: 1000,
        description: 'Device test transaction',
        date: new Date().toISOString(),
        type: 'sale'
      });
      
      const duration = Date.now() - startTime;
      console.log(\`✅ Transaction created in \${duration}ms\`);
      
      return { success: true, duration, transactionId: transaction.id };
    } catch (error) {
      console.error('❌ Transaction creation failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async testBulkOperations() {
    console.log('📊 Testing bulk operations...');
    const results = {};
    
    // Test bulk customer creation
    const customerStartTime = Date.now();
    const customers = [];
    
    try {
      for (let i = 0; i < ${deviceTestConfig.testDataSizes.medium}; i++) {
        customers.push({
          name: \`Bulk Customer \${i}\`,
          phone: \`+234\${String(i).padStart(10, '0')}\`,
          email: \`bulk\${i}@test.device\`
        });
      }
      
      // Create customers in batches
      const batchSize = 50;
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        await Promise.all(
          batch.map(customer => 
            this.databaseService.customers.create(customer)
          )
        );
      }
      
      const customerDuration = Date.now() - customerStartTime;
      results.bulkCustomers = { 
        success: true, 
        duration: customerDuration,
        count: customers.length 
      };
      
      console.log(\`✅ Created \${customers.length} customers in \${customerDuration}ms\`);
      
    } catch (error) {
      console.error('❌ Bulk customer creation failed:', error);
      results.bulkCustomers = { success: false, error: error.message };
    }
    
    return results;
  }
  
  async testQueryPerformance() {
    console.log('⚡ Testing query performance...');
    const results = {};
    
    try {
      // Test customer queries
      const customerQueryStart = Date.now();
      const customers = await this.databaseService.customers.findAll();
      const customerQueryDuration = Date.now() - customerQueryStart;
      
      results.customerQueries = {
        success: true,
        duration: customerQueryDuration,
        recordCount: customers.length
      };
      
      console.log(\`✅ Customer query completed in \${customerQueryDuration}ms (\${customers.length} records)\`);
      
      // Test transaction queries
      const transactionQueryStart = Date.now();
      const transactions = await this.databaseService.transactions.getAllTransactions();
      const transactionQueryDuration = Date.now() - transactionQueryStart;
      
      results.transactionQueries = {
        success: true,
        duration: transactionQueryDuration,
        recordCount: transactions.length
      };
      
      console.log(\`✅ Transaction query completed in \${transactionQueryDuration}ms (\${transactions.length} records)\`);
      
    } catch (error) {
      console.error('❌ Query performance test failed:', error);
      results.queryError = { success: false, error: error.message };
    }
    
    return results;
  }
  
  async testMemoryPressure() {
    console.log('🧠 Testing under memory pressure...');
    
    try {
      // Create large datasets to test memory handling
      const largeData = new Array(${deviceTestConfig.testDataSizes.large}).fill(0).map((_, i) => ({
        name: \`Memory Test Customer \${i}\`,
        phone: \`+234\${String(i).padStart(10, '0')}\`,
        description: 'A'.repeat(1000) // 1KB of text per record
      }));
      
      const startTime = Date.now();
      
      // Process in chunks to avoid memory issues
      const chunkSize = 100;
      for (let i = 0; i < largeData.length; i += chunkSize) {
        const chunk = largeData.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(data => 
            this.databaseService.customers.create(data)
          )
        );
        
        // Log progress
        if (i % 1000 === 0) {
          console.log(\`Processed \${i}/\${largeData.length} records\`);
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(\`✅ Memory pressure test completed in \${duration}ms\`);
      
      return { success: true, duration, recordCount: largeData.length };
    } catch (error) {
      console.error('❌ Memory pressure test failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async runDeviceSpecificTests() {
    console.log('📱 Running device-specific tests...');
    
    const results = {
      initialization: await this.initialize(),
      basicOperations: null,
      memoryPressure: null,
      deviceInfo: this.getDeviceInfo()
    };
    
    if (results.initialization) {
      results.basicOperations = await this.testDatabaseOperations();
      results.memoryPressure = await this.testMemoryPressure();
    }
    
    // Log comprehensive results
    console.log('📊 Device Test Results:', JSON.stringify(results, null, 2));
    
    return results;
  }
  
  getDeviceInfo() {
    // You can expand this with actual device info APIs
    return {
      platform: 'mobile',
      timestamp: new Date().toISOString(),
      testDatabase: 'test_klyntl.db'
    };
  }
  
  async cleanup() {
    try {
      if (this.db) {
        await this.db.closeAsync();
        // Optionally delete test database
        // await SQLite.deleteDatabaseAsync('test_klyntl.db');
        console.log('✅ Test cleanup completed');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}
`;

// Create the helper file
fs.writeFileSync(
  path.resolve(__dirname, "../src/utils/DeviceTestHelper.ts"),
  deviceTestHelper
);

// Create test configuration
fs.writeFileSync(
  path.resolve(__dirname, "../device-test-config.json"),
  JSON.stringify(deviceTestConfig, null, 2)
);

console.log("✅ Device testing files created!");
console.log("📁 Files created:");
console.log("  - src/utils/DeviceTestHelper.ts");
console.log("  - device-test-config.json");
console.log("  - scripts/test-db-device.js");
