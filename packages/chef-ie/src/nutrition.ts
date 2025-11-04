/**
 * Nutrition estimation using offline ingredient database
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { RecipeIngredient, RecipeNutrition } from '@ultimate-social-chef/shared';
import { convertToMetric } from './units.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface NutritionData {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

type NutritionDatabase = Record<string, NutritionData>;

let nutritionDb: NutritionDatabase | null = null;

/**
 * Load nutrition database
 */
function loadNutritionDb(): NutritionDatabase {
  if (nutritionDb) return nutritionDb;

  const dbPath = resolve(__dirname, '../nutrition.json');
  const content = readFileSync(dbPath, 'utf-8');
  nutritionDb = JSON.parse(content);

  return nutritionDb!;
}

/**
 * Find nutrition data for an ingredient (fuzzy match)
 */
function findNutritionData(ingredientName: string): NutritionData | null {
  const db = loadNutritionDb();
  const normalized = ingredientName.toLowerCase().trim();

  // Try exact match first
  if (db[normalized]) {
    return db[normalized];
  }

  // Try partial matches
  for (const [key, value] of Object.entries(db)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

/**
 * Estimate nutrition for a single ingredient
 */
function estimateIngredientNutrition(ingredient: RecipeIngredient): NutritionData {
  const nutritionPer100g = findNutritionData(ingredient.name);

  if (!nutritionPer100g) {
    // Unknown ingredient, return zero
    return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  }

  // Try to convert to grams for scaling
  let scaleFactor = 1; // Default to 100g

  if (ingredient.qty && ingredient.unit) {
    const metric = convertToMetric(ingredient.qty, ingredient.unit);
    if (metric?.grams) {
      scaleFactor = metric.grams / 100; // Scale from per 100g
    } else if (metric?.milliliters) {
      // Rough approximation: 1ml ≈ 1g for most liquids
      scaleFactor = metric.milliliters / 100;
    }
  }

  return {
    kcal: nutritionPer100g.kcal * scaleFactor,
    protein: nutritionPer100g.protein * scaleFactor,
    carbs: nutritionPer100g.carbs * scaleFactor,
    fat: nutritionPer100g.fat * scaleFactor,
  };
}

/**
 * Estimate total nutrition for a recipe
 */
export function estimateNutrition(ingredients: RecipeIngredient[]): RecipeNutrition {
  const total = ingredients.reduce(
    (acc, ingredient) => {
      const nutrition = estimateIngredientNutrition(ingredient);
      return {
        kcal: acc.kcal + nutrition.kcal,
        protein: acc.protein + nutrition.protein,
        carbs: acc.carbs + nutrition.carbs,
        fat: acc.fat + nutrition.fat,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Round to reasonable precision
  return {
    kcal: Math.round(total.kcal),
    protein: Math.round(total.protein * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
  };
}
