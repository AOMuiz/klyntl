// ===== CORE INTERFACES AND TYPES =====
export interface DatabaseConfig {
  customerActiveDays: number;
  defaultLowStockThreshold: number;
  defaultPageSize: number;
  enableAuditLog: boolean;
  maxBatchSize: number;
}

export interface AuditLogEntry {
  id: string;
  tableName: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  recordId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: string;
}
