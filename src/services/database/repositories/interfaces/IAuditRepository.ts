// New IAuditRepository for audit logging
export interface IAuditLogEntry {
  id: string;
  tableName: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  recordId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: string;
  userId?: string; // For future user tracking
}

export interface IAuditRepository {
  log(entry: Omit<IAuditLogEntry, "id" | "timestamp">): Promise<void>;
  getAuditLog(
    tableName?: string,
    recordId?: string,
    operation?: string,
    limit?: number,
    offset?: number
  ): Promise<IAuditLogEntry[]>;
  getAuditLogForRecord(
    tableName: string,
    recordId: string
  ): Promise<IAuditLogEntry[]>;
  cleanupOldEntries(olderThanDays: number): Promise<number>;
}
