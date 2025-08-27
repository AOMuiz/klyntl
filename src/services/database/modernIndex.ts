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
export { DatabaseService, createDatabaseService } from "./service";

// Re-export types for convenience
export type { Migration } from "./migrations";

// Legacy export for backward compatibility
export { DatabaseService as databaseService } from "./service";
