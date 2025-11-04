/**
 * Main recipe extraction orchestrator
 */

import type { Video, Recipe, RecipeIngredient, RecipeStep } from '@ultimate-social-chef/shared';
import { extractIngredients, detectAllergens } from './ingredients.js';
import { extractSteps, extractEquipment, classifyDifficulty } from './steps.js';
import { extractTimes, estimateTimeFromComplexity } from './time.js';
import { estimateNutrition } from './nutrition.js';
import { classifyCuisine } from './cuisine.js';
import { nanoid } from 'nanoid';

export interface ExtractionContext {
  video: Video;
  captionText?: string; // Optional caption/subtitle text
}

/**
 * Compute actionability score for a video
 * 0.35 * has_ingredients
 * + 0.35 * has_method_steps
 * + 0.10 * has_timing
 * + 0.05 * has_yield
 * + 0.05 * equipment_detected
 * + 0.10 * clarity (avg step length within 6–24 tokens & verb-led)
 */
export function computeActionabilityScore(
  ingredients: RecipeIngredient[],
  steps: RecipeStep[],
  yieldText: string | null,
  equipment: string[]
): number {
  let score = 0;

  // Has ingredients
  if (ingredients.length > 0) {
    score += 0.35;
  }

  // Has method steps
  if (steps.length > 0) {
    score += 0.35;
  }

  // Has timing
  const hasTiming = steps.some(s => s.timers && s.timers.length > 0);
  if (hasTiming) {
    score += 0.10;
  }

  // Has yield
  if (yieldText) {
    score += 0.05;
  }

  // Equipment detected
  if (equipment.length > 0) {
    score += 0.05;
  }

  // Clarity: check if steps are well-formed
  if (steps.length > 0) {
    const avgTokens = steps.reduce((sum, s) => {
      const tokens = s.text.split(/\s+/).length;
      return sum + tokens;
    }, 0) / steps.length;

    // Good clarity if average step is 6-24 tokens
    if (avgTokens >= 6 && avgTokens <= 24) {
      score += 0.10;
    } else if (avgTokens > 0) {
      score += 0.05; // Partial credit
    }
  }

  return Math.min(1, score);
}

/**
 * Extract yield information from text
 */
function extractYield(text: string): { yieldText: string | null; servings: number | null } {
  const normalized = text.toLowerCase();

  // Pattern: "serves 4", "makes 12 cookies", "yields 6 servings"
  const servesMatch = normalized.match(/serves?\s+(\d+)/);
  if (servesMatch) {
    const servings = parseInt(servesMatch[1]);
    return {
      yieldText: `Serves ${servings}`,
      servings,
    };
  }

  const makesMatch = normalized.match(/makes?\s+(\d+)/);
  if (makesMatch) {
    const count = parseInt(makesMatch[1]);
    return {
      yieldText: `Makes ${count}`,
      servings: count,
    };
  }

  const yieldsMatch = normalized.match(/yields?\s+(\d+)/);
  if (yieldsMatch) {
    const count = parseInt(yieldsMatch[1]);
    return {
      yieldText: `Yields ${count}`,
      servings: count,
    };
  }

  return { yieldText: null, servings: null };
}

/**
 * Main extraction function
 */
export function extractRecipe(context: ExtractionContext): Recipe {
  const { video, captionText } = context;

  // Combine all text sources
  const allText = [
    video.title,
    video.description || '',
    captionText || '',
    video.hashtags.join(' '),
  ].join('\n');

  // Extract ingredients
  const ingredients = extractIngredients(allText);

  // Extract steps
  const steps = extractSteps(allText);

  // Extract equipment
  const equipment = extractEquipment(allText);

  // Extract yield
  const { yieldText, servings } = extractYield(allText);

  // Extract times
  const allTimes = extractTimes(allText);
  const explicitTotalMin = allTimes.length > 0
    ? Math.max(...allTimes)
    : null;

  // Estimate time if not explicit
  const techniques = steps.map(s => s.text.toLowerCase());
  const estimatedTotalMin = estimateTimeFromComplexity(
    steps.length,
    ingredients.length,
    techniques
  );

  const totalMin = explicitTotalMin || estimatedTotalMin;

  // Rough split: 60% active, 40% passive
  const activeMin = Math.round(totalMin * 0.6);
  const passiveMin = totalMin - activeMin;

  // Detect allergens
  const allergens = detectAllergens(ingredients);

  // Classify cuisine
  const ingredientNames = ingredients.map(i => i.name);
  const cuisine = classifyCuisine(allText, ingredientNames);

  // Classify difficulty
  const difficulty = classifyDifficulty(
    ingredients.length,
    steps.length,
    techniques
  );

  // Estimate nutrition
  const nutrition = ingredients.length > 0
    ? estimateNutrition(ingredients)
    : null;

  // Compute confidence scores per field
  const confidence: Record<string, number> = {
    name: 1.0, // We always have title
    ingredients: ingredients.length > 0 ? 0.8 : 0.2,
    steps: steps.length > 0 ? 0.8 : 0.2,
    timing: allTimes.length > 0 ? 0.9 : 0.3,
    yield: yieldText ? 0.8 : 0.2,
    equipment: equipment.length > 0 ? 0.7 : 0.3,
    cuisine: cuisine !== 'Other' ? 0.7 : 0.3,
    difficulty: 0.6,
    allergens: allergens.length > 0 ? 0.7 : 0.5,
    nutrition: nutrition ? 0.5 : 0, // Rough estimates
  };

  const recipe: Recipe = {
    id: nanoid(),
    videoId: video.id,
    name: video.title,
    cuisine,
    difficulty,
    yieldText,
    servings,
    totalMin,
    activeMin,
    passiveMin,
    ingredients,
    steps,
    equipment,
    allergens,
    nutrition,
    confidence,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return recipe;
}
