/**
 * Zod validation schemas for runtime type safety
 */

import { z } from 'zod';

export const platformSchema = z.enum(['youtube', 'tiktok']);

export const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);

export const cuisineSchema = z.enum([
  'Italian',
  'Chinese',
  'Japanese',
  'Korean',
  'Indian',
  'Mexican',
  'Thai',
  'French',
  'American',
  'Mediterranean',
  'Middle Eastern',
  'Vietnamese',
  'Spanish',
  'Greek',
  'Caribbean',
  'African',
  'British',
  'German',
  'Other',
]);

export const creatorScoreSchema = z.object({
  vm: z.number().min(0).max(1),
  ed: z.number().min(0).max(1),
  cons: z.number().min(0).max(1),
  act: z.number().min(0).max(1),
  nov: z.number().min(0).max(1),
  auth: z.number().min(0).max(1),
  total: z.number(),
});

export const videoScoreSchema = z.object({
  perf: z.number().min(0).max(1),
  act: z.number().min(0).max(1),
  rec: z.number().min(0).max(1),
  total: z.number(),
});

export const videoStatsSchema = z.object({
  views: z.number().nonnegative(),
  likes: z.number().nonnegative(),
  comments: z.number().nonnegative(),
  shares: z.number().nonnegative(),
  hoursSincePost: z.number().optional(),
});

export const recipeIngredientSchema = z.object({
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  name: z.string(),
  notes: z.string().optional(),
  original: z.string(),
});

export const recipeStepSchema = z.object({
  n: z.number().positive(),
  text: z.string(),
  timers: z.array(z.object({ min: z.number(), max: z.number().optional() })).optional(),
  tempC: z.number().optional(),
});

export const recipeNutritionSchema = z.object({
  kcal: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

export const creatorSchema = z.object({
  id: z.string(),
  platform: platformSchema,
  handle: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  followers: z.number().nonnegative(),
  creatorScore: z.number(),
  creatorScoreBreakdown: creatorScoreSchema.nullable(),
  cuisinePrimary: cuisineSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const videoSchema = z.object({
  id: z.string(),
  platformId: z.string(),
  creatorId: z.string(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  publishedAt: z.coerce.date(),
  durationSec: z.number().nonnegative(),
  stats: videoStatsSchema,
  hashtags: z.array(z.string()),
  recipeScore: z.number().nullable(),
  recipeScoreBreakdown: videoScoreSchema.nullable(),
  embedHtml: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const recipeSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  name: z.string(),
  cuisine: cuisineSchema.nullable(),
  difficulty: difficultySchema.nullable(),
  yieldText: z.string().nullable(),
  servings: z.number().nullable(),
  totalMin: z.number().nullable(),
  activeMin: z.number().nullable(),
  passiveMin: z.number().nullable(),
  ingredients: z.array(recipeIngredientSchema),
  steps: z.array(recipeStepSchema),
  equipment: z.array(z.string()),
  allergens: z.array(z.string()),
  nutrition: recipeNutritionSchema.nullable(),
  confidence: z.record(z.number()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// API schemas
export const getCreatorsQuerySchema = z.object({
  limit: z.coerce.number().positive().optional(),
  cuisine: cuisineSchema.optional(),
  platform: platformSchema.optional(),
});

export const getRecipesQuerySchema = z.object({
  query: z.string().optional(),
  cuisine: cuisineSchema.optional(),
  difficulty: difficultySchema.optional(),
  time_lte: z.coerce.number().positive().optional(),
  dietary: z.string().optional(), // Comma-separated allergens to exclude
  limit: z.coerce.number().positive().optional(),
});

export const adminPasswordSchema = z.object({
  password: z.string(),
});

export const feedbackSchema = z.object({
  recipeId: z.string(),
  userJson: z.unknown(),
});
