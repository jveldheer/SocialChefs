/**
 * SQLite database client using better-sqlite3 and Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import { resolve, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Get database path from environment or use default
const getDatabasePath = () => {
  const dbUrl = process.env.DATABASE_URL || 'file:./data/social-chef.db';
  const path = dbUrl.replace('file:', '');

  // Ensure directory exists
  const dir = dirname(resolve(process.cwd(), path));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return resolve(process.cwd(), path);
};

let dbInstance: BetterSqlite3.Database | null = null;
let drizzleInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!drizzleInstance) {
    const dbPath = getDatabasePath();
    dbInstance = new Database(dbPath);

    // Enable WAL mode for better concurrent access
    dbInstance.pragma('journal_mode = WAL');

    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON');

    drizzleInstance = drizzle(dbInstance, { schema });
  }

  return drizzleInstance;
}

export function getSqlite(): BetterSqlite3.Database {
  if (!dbInstance) {
    getDb(); // Initialize if needed
  }
  return dbInstance!;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    drizzleInstance = null;
  }
}

// Re-export schema for convenience
export * from './schema.js';
