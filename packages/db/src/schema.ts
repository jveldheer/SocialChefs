/**
 * Drizzle ORM schema for SQLite database
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Creators table
export const creators = sqliteTable('creators', {
  id: text('id').primaryKey(),
  platform: text('platform', { enum: ['youtube', 'tiktok'] }).notNull(),
  handle: text('handle').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  followers: integer('followers').notNull().default(0),
  creatorScore: real('creator_score').notNull().default(0),
  creatorScoreBreakdown: text('creator_score_breakdown', { mode: 'json' }), // JSON CreatorScore
  cuisinePrimary: text('cuisine_primary'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  platformIdx: index('creators_platform_idx').on(table.platform),
  cuisineIdx: index('creators_cuisine_idx').on(table.cuisinePrimary),
  scoreIdx: index('creators_score_idx').on(table.creatorScore),
}));

// Videos table
export const videos = sqliteTable('videos', {
  id: text('id').primaryKey(),
  platformId: text('platform_id').notNull().unique(),
  creatorId: text('creator_id').notNull().references(() => creators.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
  durationSec: integer('duration_sec').notNull(),
  stats: text('stats', { mode: 'json' }).notNull(), // JSON VideoStats
  hashtags: text('hashtags', { mode: 'json' }).notNull().default('[]'), // JSON string[]
  recipeScore: real('recipe_score'),
  recipeScoreBreakdown: text('recipe_score_breakdown', { mode: 'json' }), // JSON VideoScore
  embedHtml: text('embed_html'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  creatorIdx: index('videos_creator_idx').on(table.creatorId),
  publishedIdx: index('videos_published_idx').on(table.publishedAt),
  scoreIdx: index('videos_recipe_score_idx').on(table.recipeScore),
}));

// Recipes table
export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }).unique(),
  name: text('name').notNull(),
  cuisine: text('cuisine'),
  difficulty: text('difficulty', { enum: ['EASY', 'MEDIUM', 'HARD'] }),
  yieldText: text('yield_text'),
  servings: integer('servings'),
  totalMin: integer('total_min'),
  activeMin: integer('active_min'),
  passiveMin: integer('passive_min'),
  ingredients: text('ingredients', { mode: 'json' }).notNull(), // JSON RecipeIngredient[]
  steps: text('steps', { mode: 'json' }).notNull(), // JSON RecipeStep[]
  equipment: text('equipment', { mode: 'json' }).notNull().default('[]'), // JSON string[]
  allergens: text('allergens', { mode: 'json' }).notNull().default('[]'), // JSON string[]
  nutrition: text('nutrition', { mode: 'json' }), // JSON RecipeNutrition
  confidence: text('confidence', { mode: 'json' }).notNull(), // JSON Record<string, number>
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  videoIdx: index('recipes_video_idx').on(table.videoId),
  cuisineIdx: index('recipes_cuisine_idx').on(table.cuisine),
  difficultyIdx: index('recipes_difficulty_idx').on(table.difficulty),
  timeIdx: index('recipes_total_min_idx').on(table.totalMin),
}));

// Raw blobs table (for API response storage)
export const rawBlobs = sqliteTable('raw_blobs', {
  id: text('id').primaryKey(),
  platform: text('platform', { enum: ['youtube', 'tiktok'] }).notNull(),
  externalId: text('external_id').notNull(),
  data: text('data', { mode: 'json' }).notNull(), // JSON unknown
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  externalIdx: index('raw_blobs_external_idx').on(table.platform, table.externalId),
}));

// Jobs table
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] }).notNull().default('pending'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  log: text('log'),
}, (table) => ({
  statusIdx: index('jobs_status_idx').on(table.status),
  typeIdx: index('jobs_type_idx').on(table.type),
}));

// Feedback table
export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  userJson: text('user_json', { mode: 'json' }).notNull(), // JSON unknown
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  recipeIdx: index('feedback_recipe_idx').on(table.recipeId),
}));

// FTS5 virtual tables for full-text search
// Note: These are created via raw SQL in migrations since Drizzle doesn't have full FTS5 support yet
export const videosFts = sqliteTable('videos_fts', {
  rowid: integer('rowid').primaryKey(),
  title: text('title'),
  description: text('description'),
  hashtags: text('hashtags'),
});

export const recipesFts = sqliteTable('recipes_fts', {
  rowid: integer('rowid').primaryKey(),
  name: text('name'),
  ingredientsText: text('ingredients_text'),
  stepsText: text('steps_text'),
});
