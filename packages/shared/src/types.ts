/**
 * Shared TypeScript types for the Ultimate Social Chef monorepo
 */

export type Platform = 'youtube' | 'tiktok';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type Cuisine =
  | 'Italian'
  | 'Chinese'
  | 'Japanese'
  | 'Korean'
  | 'Indian'
  | 'Mexican'
  | 'Thai'
  | 'French'
  | 'American'
  | 'Mediterranean'
  | 'Middle Eastern'
  | 'Vietnamese'
  | 'Spanish'
  | 'Greek'
  | 'Caribbean'
  | 'African'
  | 'British'
  | 'German'
  | 'Other';

// Creator scoring components
export interface CreatorScore {
  vm: number; // Viral Momentum
  ed: number; // Engagement Depth
  cons: number; // Consistency
  act: number; // Actionability
  nov: number; // Novelty
  auth: number; // Authenticity
  total: number; // Final weighted score
}

// Video scoring components
export interface VideoScore {
  perf: number; // Performance Score
  act: number; // Actionability Score
  rec: number; // Recency Boost
  total: number; // Final recipe-worthiness score
}

// Creator entity
export interface Creator {
  id: string;
  platform: Platform;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  followers: number;
  creatorScore: number;
  creatorScoreBreakdown: CreatorScore | null;
  cuisinePrimary: Cuisine | null;
  createdAt: Date;
  updatedAt: Date;
}

// Video entity
export interface Video {
  id: string;
  platformId: string; // External ID on platform
  creatorId: string;
  url: string;
  title: string;
  description: string | null;
  publishedAt: Date;
  durationSec: number;
  stats: VideoStats;
  hashtags: string[];
  recipeScore: number | null;
  recipeScoreBreakdown: VideoScore | null;
  embedHtml: string | null;
  createdAt: Date;
}

export interface VideoStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  hoursSincePost?: number;
}

// Recipe ingredient
export interface RecipeIngredient {
  qty: number | null;
  unit: string | null;
  name: string;
  notes?: string;
  original: string; // Original line from extraction
}

// Recipe step
export interface RecipeStep {
  n: number; // Step number
  text: string;
  timers?: Array<{ min: number; max?: number }>; // Time in minutes
  tempC?: number; // Temperature in Celsius
}

// Recipe nutrition (rough estimates)
export interface RecipeNutrition {
  kcal: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

// Recipe entity
export interface Recipe {
  id: string;
  videoId: string;
  name: string;
  cuisine: Cuisine | null;
  difficulty: Difficulty | null;
  yieldText: string | null; // E.g., "4 servings", "1 loaf"
  servings: number | null;
  totalMin: number | null; // Total time in minutes
  activeMin: number | null; // Active time in minutes
  passiveMin: number | null; // Passive time (baking, cooling, etc.)
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  equipment: string[];
  allergens: string[];
  nutrition: RecipeNutrition | null;
  confidence: Record<string, number>; // Field-level confidence scores
  createdAt: Date;
  updatedAt: Date;
}

// Raw blob storage
export interface RawBlob {
  id: string;
  platform: Platform;
  externalId: string;
  data: unknown; // JSON data from platform API
  fetchedAt: Date;
}

// Job tracking
export interface Job {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date | null;
  finishedAt: Date | null;
  log: string | null;
}

// Feedback
export interface Feedback {
  id: string;
  recipeId: string;
  userJson: unknown;
  createdAt: Date;
}
