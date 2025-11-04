/**
 * Cuisine classification using rule-based taxonomy
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import type { Cuisine } from '@ultimate-social-chef/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CuisineRules {
  [cuisine: string]: {
    ingredients: string[];
    dishes: string[];
  };
}

let cuisineRules: CuisineRules | null = null;

/**
 * Load cuisine rules from YAML
 */
function loadCuisineRules(): CuisineRules {
  if (cuisineRules) return cuisineRules;

  const rulesPath = resolve(__dirname, '../cuisine_rules.yaml');
  const content = readFileSync(rulesPath, 'utf-8');
  cuisineRules = yaml.load(content) as CuisineRules;

  return cuisineRules;
}

/**
 * Classify cuisine based on text content (title, description, ingredients)
 */
export function classifyCuisine(text: string, ingredients: string[] = []): Cuisine | null {
  const rules = loadCuisineRules();
  const normalizedText = text.toLowerCase();
  const normalizedIngredients = ingredients.map(i => i.toLowerCase());
  const allText = [normalizedText, ...normalizedIngredients].join(' ');

  const scores: Record<string, number> = {};

  for (const [cuisine, ruleSet] of Object.entries(rules)) {
    let score = 0;

    // Check ingredient keywords
    for (const keyword of ruleSet.ingredients) {
      if (allText.includes(keyword.toLowerCase())) {
        score += 2; // Ingredients are strong signals
      }
    }

    // Check dish keywords
    for (const keyword of ruleSet.dishes) {
      if (allText.includes(keyword.toLowerCase())) {
        score += 3; // Dishes are even stronger signals
      }
    }

    if (score > 0) {
      scores[cuisine] = score;
    }
  }

  // Return cuisine with highest score
  if (Object.keys(scores).length === 0) {
    return 'Other';
  }

  const sortedCuisines = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sortedCuisines[0][0] as Cuisine;
}
