/**
 * SQLite database client using better-sqlite3 and Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import { resolve, dirname } from 'path';
import { mkdirSync, existsSync, accessSync, constants } from 'fs';

// Check if we're in a read-only environment (e.g., Vercel serverless)
const isReadOnlyEnvironment = () => {
  // Check for Vercel environment
  if (process.env.VERCEL) {
    return true;
  }

  // Try to write to the current working directory
  try {
    const testPath = resolve(process.cwd(), '.write-test');
    accessSync(dirname(testPath), constants.W_OK);
    return false;
  } catch {
    return true;
  }
};

// Get database path from environment or use default
const getDatabasePath = () => {
  // If in a read-only environment, use in-memory database
  if (isReadOnlyEnvironment()) {
    console.log('[DB] Read-only environment detected, using in-memory database');
    return ':memory:';
  }

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
let isInMemory = false;

export function getDb() {
  if (!drizzleInstance) {
    const dbPath = getDatabasePath();
    isInMemory = dbPath === ':memory:';
    dbInstance = new Database(dbPath);

    // Enable WAL mode for better concurrent access (not available for in-memory)
    if (!isInMemory) {
      dbInstance.pragma('journal_mode = WAL');
    }

    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON');

    drizzleInstance = drizzle(dbInstance, { schema });

    // If in-memory, initialize schema
    if (isInMemory) {
      console.log('[DB] Initializing in-memory database schema');
      initializeSchema();
    }
  }

  return drizzleInstance;
}

// Initialize schema for in-memory database
function initializeSchema() {
  if (!dbInstance) return;

  // Create tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS creators (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      handle TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      followers INTEGER NOT NULL DEFAULT 0,
      creator_score REAL NOT NULL DEFAULT 0,
      creator_score_breakdown TEXT,
      cuisine_primary TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      platform_id TEXT,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      duration_sec INTEGER,
      published_at INTEGER,
      stats TEXT NOT NULL,
      hashtags TEXT NOT NULL,
      embed_html TEXT,
      recipe_score REAL,
      recipe_score_breakdown TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cuisine TEXT,
      difficulty TEXT,
      total_min INTEGER,
      servings INTEGER,
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      equipment TEXT NOT NULL,
      allergens TEXT NOT NULL,
      nutrition TEXT,
      confidence TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_creators_score ON creators(creator_score DESC);
    CREATE INDEX IF NOT EXISTS idx_creators_platform ON creators(platform);
    CREATE INDEX IF NOT EXISTS idx_videos_creator ON videos(creator_id);
    CREATE INDEX IF NOT EXISTS idx_videos_recipe_score ON videos(recipe_score DESC);
    CREATE INDEX IF NOT EXISTS idx_recipes_video ON recipes(video_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
  `);

  console.log('[DB] Schema initialized');

  // Seed with demo data if DEMO_MODE is enabled
  if (process.env.DEMO_MODE === 'true') {
    seedDemoData();
  }
}

// Seed demo data for in-memory database
function seedDemoData() {
  if (!dbInstance) return;

  console.log('[DB] Seeding demo data...');

  // Import demo data inline
  const { demoCreators, demoVideos, demoRecipes } = require('./demo-data.js');

  // Insert creators
  const insertCreator = dbInstance.prepare(`
    INSERT INTO creators (id, platform, handle, display_name, avatar_url, followers, creator_score, creator_score_breakdown, cuisine_primary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const creator of demoCreators) {
    insertCreator.run(
      creator.id,
      creator.platform,
      creator.handle,
      creator.displayName,
      creator.avatarUrl,
      creator.followers,
      creator.creatorScore,
      JSON.stringify(creator.creatorScoreBreakdown),
      creator.cuisinePrimary
    );
  }

  // Insert videos
  const insertVideo = dbInstance.prepare(`
    INSERT INTO videos (id, creator_id, platform, platform_id, url, title, description, published_at, duration_sec, stats, hashtags, recipe_score, recipe_score_breakdown, embed_html)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const video of demoVideos) {
    insertVideo.run(
      video.id,
      video.creatorId,
      video.platform,
      video.platformId,
      video.url,
      video.title,
      video.description,
      Math.floor(new Date(video.publishedAt).getTime() / 1000),
      video.durationSec,
      JSON.stringify(video.stats),
      JSON.stringify(video.hashtags),
      video.recipeScore,
      JSON.stringify(video.recipeScoreBreakdown),
      video.embedHtml
    );
  }

  // Insert recipes
  const insertRecipe = dbInstance.prepare(`
    INSERT INTO recipes (id, video_id, name, cuisine, difficulty, total_min, servings, ingredients, steps, equipment, allergens, nutrition, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const recipe of demoRecipes) {
    insertRecipe.run(
      recipe.id,
      recipe.videoId,
      recipe.name,
      recipe.cuisine,
      recipe.difficulty,
      recipe.totalMin,
      recipe.servings,
      JSON.stringify(recipe.ingredients),
      JSON.stringify(recipe.steps),
      JSON.stringify(recipe.equipment),
      JSON.stringify(recipe.allergens),
      JSON.stringify(recipe.nutrition),
      JSON.stringify(recipe.confidence)
    );
  }

  console.log(`[DB] Seeded ${demoCreators.length} creators, ${demoVideos.length} videos, ${demoRecipes.length} recipes`);
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
