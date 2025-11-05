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

  // Demo data inlined for reliability in serverless environments
  const demoCreators = [
    {
      id: 'creator_1',
      platform: 'youtube',
      handle: '@ThePastaQueen',
      displayName: 'Pasta Queen',
      avatarUrl: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=PQ',
      followers: 850000,
      creatorScore: 0.92,
      creatorScoreBreakdown: { vm: 0.95, ed: 0.88, cons: 0.91, act: 0.94, nov: 0.87, auth: 0.96, total: 0.92 },
      cuisinePrimary: 'Italian'
    },
    {
      id: 'creator_2',
      platform: 'tiktok',
      handle: '@KoreanFoodBae',
      displayName: 'Korean Food Bae',
      avatarUrl: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=KFB',
      followers: 1200000,
      creatorScore: 0.90,
      creatorScoreBreakdown: { vm: 0.98, ed: 0.92, cons: 0.85, act: 0.89, nov: 0.91, auth: 0.93, total: 0.90 },
      cuisinePrimary: 'Korean'
    },
    {
      id: 'creator_3',
      platform: 'youtube',
      handle: '@TacoTuesday247',
      displayName: 'Taco Tuesday 24/7',
      avatarUrl: 'https://via.placeholder.com/150/F7DC6F/FFFFFF?text=TT',
      followers: 650000,
      creatorScore: 0.87,
      creatorScoreBreakdown: { vm: 0.89, ed: 0.85, cons: 0.84, act: 0.92, nov: 0.88, auth: 0.90, total: 0.87 },
      cuisinePrimary: 'Mexican'
    }
  ];

  const demoVideos = [
    {
      id: 'video_1',
      creatorId: 'creator_1',
      platform: 'youtube',
      platformId: 'dQw4w9WgXcQ',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      title: '60-Second Carbonara That Actually Works',
      description: 'Quick and authentic Roman carbonara without cream!',
      publishedAt: '2024-01-15T00:00:00.000Z',
      durationSec: 58,
      stats: { views: 2500000, likes: 185000, comments: 12400, saves: 45000, shares: 28000 },
      hashtags: ['carbonara', 'pasta', 'italian', 'quickrecipe'],
      recipeScore: 0.94,
      recipeScoreBreakdown: { clarity: 0.96, completeness: 0.93, actionability: 0.95, total: 0.94 },
      embedHtml: null
    },
    {
      id: 'video_2',
      creatorId: 'creator_2',
      platform: 'tiktok',
      platformId: '7234567890123456789',
      url: 'https://tiktok.com/@KoreanFoodBae/video/7234567890123456789',
      title: 'Korean Fried Chicken Glaze Hack',
      description: 'Get that crispy KFC glaze at home with 3 ingredients',
      publishedAt: '2024-01-20T00:00:00.000Z',
      durationSec: 45,
      stats: { views: 4200000, likes: 320000, comments: 18500, saves: 67000, shares: 51000 },
      hashtags: ['koreanfood', 'friedchicken', 'kfc', 'foodhack'],
      recipeScore: 0.91,
      recipeScoreBreakdown: { clarity: 0.89, completeness: 0.90, actionability: 0.94, total: 0.91 },
      embedHtml: null
    }
  ];

  const demoRecipes = [
    {
      id: 'recipe_1',
      videoId: 'video_1',
      name: '60-Second Carbonara',
      cuisine: 'Italian',
      difficulty: 'EASY',
      totalMin: 15,
      servings: 2,
      ingredients: [
        { name: 'spaghetti', qty: '200', unit: 'g' },
        { name: 'guanciale', qty: '100', unit: 'g' },
        { name: 'egg yolks', qty: '2', unit: '' },
        { name: 'pecorino romano', qty: '50', unit: 'g', notes: 'grated' },
        { name: 'black pepper', qty: '1', unit: 'tsp' }
      ],
      steps: [
        { n: 1, text: 'Cook pasta in boiling salted water until al dente' },
        { n: 2, text: 'Dice guanciale and render in pan until crispy' },
        { n: 3, text: 'Mix egg yolks, pecorino, and black pepper in bowl' },
        { n: 4, text: 'Drain pasta (save pasta water) and add to guanciale pan' },
        { n: 5, text: 'Off heat, add egg mixture and toss, adding pasta water to create creamy sauce' }
      ],
      equipment: ['large pot', 'pan', 'mixing bowl'],
      allergens: ['eggs', 'dairy'],
      nutrition: { kcal: 650, protein: 28, carbs: 72, fat: 26 },
      confidence: { ingredients: 0.98, steps: 0.95, timing: 0.92, overall: 0.95 }
    },
    {
      id: 'recipe_2',
      videoId: 'video_2',
      name: 'Korean Fried Chicken Glaze',
      cuisine: 'Korean',
      difficulty: 'MEDIUM',
      totalMin: 25,
      servings: 4,
      ingredients: [
        { name: 'chicken wings', qty: '1', unit: 'kg' },
        { name: 'gochujang', qty: '3', unit: 'tbsp' },
        { name: 'honey', qty: '2', unit: 'tbsp' },
        { name: 'soy sauce', qty: '1', unit: 'tbsp' },
        { name: 'garlic', qty: '2', unit: 'cloves', notes: 'minced' }
      ],
      steps: [
        { n: 1, text: 'Pat chicken wings dry and season with salt and pepper' },
        { n: 2, text: 'Fry wings at 350°F until golden and crispy', timers: [{ min: 10 }], tempC: 175 },
        { n: 3, text: 'Mix gochujang, honey, soy sauce, and garlic in bowl' },
        { n: 4, text: 'Toss hot fried wings in glaze until evenly coated' },
        { n: 5, text: 'Garnish with sesame seeds and serve immediately' }
      ],
      equipment: ['deep fryer', 'mixing bowl', 'tongs'],
      allergens: ['soy', 'sesame'],
      nutrition: { kcal: 420, protein: 32, carbs: 18, fat: 24 },
      confidence: { ingredients: 0.96, steps: 0.94, timing: 0.88, overall: 0.93 }
    }
  ];

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
