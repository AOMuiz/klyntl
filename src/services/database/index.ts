// Modern database service exports
export { DatabaseProvider } from "./context";
export { useDatabase, useDatabaseDebug, useDatabaseHealth } from "./hooks";
export {
  getCurrentVersion,
  migrations,
  resetDatabase,
  rollbackToVersion,
  runMigrations,
  setVersion,
} from "./migrations";

// Use refactored service as main export
export {
  createDatabaseService,
  DatabaseService,
} from "./refactored_db_service";

// Re-export types for convenience
export type { Migration } from "./migrations";

// Legacy export for backward compatibility - points to refactored service
export { DatabaseService as databaseService } from "./refactored_db_service";
