import * as SQLite from "expo-sqlite";

export const db: SQLite.SQLiteDatabase = SQLite.openDatabaseSync("klyntl.db");
// Recommended: enforce integrity and better journaling.
db.execSync(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
`);
