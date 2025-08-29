/**
 * IAuditRepository for audit logging
 *
 * @warning
 * Do NOT pass unredacted PII/secrets in oldValues/newValues. Always mask sensitive fields (e.g., password, token, apiKey, ssn, email, phone, creditCard, privateKey) before logging.
 */

export type AuditOperation = "CREATE" | "UPDATE" | "DELETE";

export interface IAuditLogEntry {
  id: string;
  tableName: string;
  operation: AuditOperation;
  recordId: string;
  oldValues?: Partial<Record<string, unknown>>;
  newValues?: Partial<Record<string, unknown>>;
  timestamp: string;
  userId?: string; // For future user tracking
  /**
   * List of fields that were redacted in this entry (optional, for audit traceability)
   */
  redactedFields?: string[];
}

export interface IAuditRepository {
  /**
   * Log an audit entry, enforcing redaction of sensitive fields.
   * @param entry Audit log entry (oldValues/newValues will be redacted)
   * @param redactedFields Optional explicit list of redacted fields
   */
  log(
    entry: Omit<IAuditLogEntry, "id" | "timestamp" | "redactedFields">,
    redactedFields?: string[]
  ): Promise<void>;
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
