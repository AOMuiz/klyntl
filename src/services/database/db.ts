import * as SQLite from "expo-sqlite";

// In Jest environment expo-sqlite may not provide openDatabaseSync.
// Guard the call so tests can mock SQLite.openDatabaseSync/openDatabaseAsync instead.

let _db: any = undefined;
try {
  if ((SQLite as any).openDatabaseSync) {
    _db = (SQLite as any).openDatabaseSync("klyntl.db");
    // Recommended: enforce integrity and better journaling.
    _db.execSync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
    `);
  }
} catch (err) {
  // If openDatabaseSync isn't available (e.g. in test env), leave _db undefined
  console.warn(
    "expo-sqlite openDatabaseSync not available in this environment",
    err
  );
}

export const db: typeof _db = _db;
