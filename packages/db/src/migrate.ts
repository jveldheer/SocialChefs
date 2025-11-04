/**
 * Database migration script
 * Runs SQL migrations and creates FTS5 tables
 */

import { getSqlite, closeDb } from './client.js';

async function migrate() {
  console.log('Running database migrations...');

  const sqlite = getSqlite();

  try {
    // Create main tables using Drizzle schema
    console.log('Creating main tables...');

    // Tables are auto-created when accessed, but ensure they exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS creators (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL CHECK(platform IN ('youtube', 'tiktok')),
        handle TEXT NOT NULL,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        followers INTEGER NOT NULL DEFAULT 0,
        creator_score REAL NOT NULL DEFAULT 0,
        creator_score_breakdown TEXT,
        cuisine_primary TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        platform_id TEXT NOT NULL UNIQUE,
        creator_id TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        published_at INTEGER NOT NULL,
        duration_sec INTEGER NOT NULL,
        stats TEXT NOT NULL,
        hashtags TEXT NOT NULL DEFAULT '[]',
        recipe_score REAL,
        recipe_score_breakdown TEXT,
        embed_html TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        cuisine TEXT,
        difficulty TEXT CHECK(difficulty IN ('EASY', 'MEDIUM', 'HARD')),
        yield_text TEXT,
        servings INTEGER,
        total_min INTEGER,
        active_min INTEGER,
        passive_min INTEGER,
        ingredients TEXT NOT NULL,
        steps TEXT NOT NULL,
        equipment TEXT NOT NULL DEFAULT '[]',
        allergens TEXT NOT NULL DEFAULT '[]',
        nutrition TEXT,
        confidence TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS raw_blobs (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL CHECK(platform IN ('youtube', 'tiktok')),
        external_id TEXT NOT NULL,
        data TEXT NOT NULL,
        fetched_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
        started_at INTEGER,
        finished_at INTEGER,
        log TEXT
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        user_json TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS creators_platform_idx ON creators(platform);
      CREATE INDEX IF NOT EXISTS creators_cuisine_idx ON creators(cuisine_primary);
      CREATE INDEX IF NOT EXISTS creators_score_idx ON creators(creator_score);
      CREATE INDEX IF NOT EXISTS videos_creator_idx ON videos(creator_id);
      CREATE INDEX IF NOT EXISTS videos_published_idx ON videos(published_at);
      CREATE INDEX IF NOT EXISTS videos_recipe_score_idx ON videos(recipe_score);
      CREATE INDEX IF NOT EXISTS recipes_video_idx ON recipes(video_id);
      CREATE INDEX IF NOT EXISTS recipes_cuisine_idx ON recipes(cuisine);
      CREATE INDEX IF NOT EXISTS recipes_difficulty_idx ON recipes(difficulty);
      CREATE INDEX IF NOT EXISTS recipes_total_min_idx ON recipes(total_min);
      CREATE INDEX IF NOT EXISTS raw_blobs_external_idx ON raw_blobs(platform, external_id);
      CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
      CREATE INDEX IF NOT EXISTS jobs_type_idx ON jobs(type);
      CREATE INDEX IF NOT EXISTS feedback_recipe_idx ON feedback(recipe_id);
    `);

    // Create FTS5 virtual tables for full-text search
    console.log('Creating FTS5 tables...');

    // Videos FTS table
    sqlite.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS videos_fts USING fts5(
        title,
        description,
        hashtags,
        content='videos',
        content_rowid='rowid'
      );
    `);

    // Triggers to keep videos_fts in sync
    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS videos_fts_insert AFTER INSERT ON videos BEGIN
        INSERT INTO videos_fts(rowid, title, description, hashtags)
        VALUES (new.rowid, new.title, new.description, json_extract(new.hashtags, '$'));
      END;
    `);

    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS videos_fts_update AFTER UPDATE ON videos BEGIN
        UPDATE videos_fts
        SET title = new.title,
            description = new.description,
            hashtags = json_extract(new.hashtags, '$')
        WHERE rowid = new.rowid;
      END;
    `);

    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS videos_fts_delete AFTER DELETE ON videos BEGIN
        DELETE FROM videos_fts WHERE rowid = old.rowid;
      END;
    `);

    // Recipes FTS table
    sqlite.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
        name,
        ingredients_text,
        steps_text,
        content='recipes',
        content_rowid='rowid'
      );
    `);

    // Triggers to keep recipes_fts in sync
    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS recipes_fts_insert AFTER INSERT ON recipes BEGIN
        INSERT INTO recipes_fts(rowid, name, ingredients_text, steps_text)
        VALUES (
          new.rowid,
          new.name,
          json_extract(new.ingredients, '$'),
          json_extract(new.steps, '$')
        );
      END;
    `);

    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS recipes_fts_update AFTER UPDATE ON recipes BEGIN
        UPDATE recipes_fts
        SET name = new.name,
            ingredients_text = json_extract(new.ingredients, '$'),
            steps_text = json_extract(new.steps, '$')
        WHERE rowid = new.rowid;
      END;
    `);

    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS recipes_fts_delete AFTER DELETE ON recipes BEGIN
        DELETE FROM recipes_fts WHERE rowid = old.rowid;
      END;
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    closeDb();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { migrate };
