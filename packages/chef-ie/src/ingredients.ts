/**
 * Ingredient extraction and parsing
 */

import type { RecipeIngredient } from '@ultimate-social-chef/shared';
import { parseQuantity, normalizeUnit } from './units.js';

/**
 * Common culinary verbs that signal method steps (not ingredient lines)
 */
export const CULINARY_VERBS = [
  'add',
  'bake',
  'beat',
  'blend',
  'boil',
  'braise',
  'bring',
  'broil',
  'brown',
  'brush',
  'chop',
  'coat',
  'combine',
  'cook',
  'cool',
  'cover',
  'cut',
  'dice',
  'drain',
  'drizzle',
  'fold',
  'fry',
  'garnish',
  'grate',
  'grill',
  'heat',
  'julienne',
  'knead',
  'layer',
  'melt',
  'mince',
  'mix',
  'peel',
  'pour',
  'preheat',
  'reduce',
  'remove',
  'roast',
  'roll',
  'saute',
  'sauté',
  'season',
  'serve',
  'simmer',
  'slice',
  'sprinkle',
  'stir',
  'strain',
  'toss',
  'transfer',
  'warm',
  'whisk',
  'whip',
];

/**
 * Parse an ingredient line
 * Example: "2 cups flour" -> { qty: 2, unit: "cup", name: "flour", original: "..." }
 */
export function parseIngredientLine(line: string): RecipeIngredient | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // Pattern: [quantity] [unit] ingredient [notes]
  // Examples:
  // "2 cups flour"
  // "1/2 tsp salt"
  // "3 cloves garlic, minced"
  // "chicken breast"

  const quantityPattern = /^(\d+(?:\/\d+)?(?:\s+\d+\/\d+)?(?:\.\d+)?)\s*/;
  const unitPattern = /^(tsp|tbsp|cup|oz|lb|g|kg|ml|l|piece|pieces|clove|cloves|can|cans|stick|sticks|pinch|dash|slice|slices|bunch|head|sprig|sprigs|handful|to taste|floz|fl oz|pint|pints|quart|quarts|gallon|gallons|package|packages|pkg|pack|leaf|leaves|whole|pc|pcs|c|pt|qt|gal)\b\s*/i;

  let remaining = trimmed;
  let qty: number | null = null;
  let unit: string | null = null;

  // Extract quantity
  const qtyMatch = remaining.match(quantityPattern);
  if (qtyMatch) {
    qty = parseQuantity(qtyMatch[1]);
    remaining = remaining.slice(qtyMatch[0].length);
  }

  // Extract unit
  const unitMatch = remaining.match(unitPattern);
  if (unitMatch) {
    unit = normalizeUnit(unitMatch[1]);
    remaining = remaining.slice(unitMatch[0].length);
  }

  // Remaining text is the ingredient name (possibly with notes)
  let name = remaining.trim();
  let notes: string | undefined;

  // Check for notes in parentheses or after comma
  const notesMatch = name.match(/[,\(](.+)/);
  if (notesMatch) {
    notes = notesMatch[1].replace(/[\(\)]/g, '').trim();
    name = name.slice(0, notesMatch.index).trim();
  }

  if (!name) return null;

  return {
    qty,
    unit,
    name,
    notes,
    original: trimmed,
  };
}

/**
 * Extract ingredients from text
 * Uses heuristics to identify ingredient lines vs. method steps
 */
export function extractIngredients(text: string): RecipeIngredient[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const ingredients: RecipeIngredient[] = [];

  for (const line of lines) {
    // Skip lines that start with culinary verbs (likely method steps)
    const firstWord = line.split(/\s+/)[0]?.toLowerCase();
    if (CULINARY_VERBS.includes(firstWord)) {
      continue;
    }

    // Try to parse as ingredient
    const ingredient = parseIngredientLine(line);
    if (ingredient) {
      ingredients.push(ingredient);
    }
  }

  return ingredients;
}

/**
 * Detect allergens in ingredients
 */
export function detectAllergens(ingredients: RecipeIngredient[]): string[] {
  const allergenMap: Record<string, string[]> = {
    gluten: ['flour', 'wheat', 'bread', 'pasta', 'soy sauce', 'barley', 'rye'],
    dairy: ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'ghee'],
    egg: ['egg', 'eggs', 'mayo', 'mayonnaise'],
    soy: ['soy', 'tofu', 'tempeh', 'miso', 'soy sauce', 'edamame'],
    peanut: ['peanut', 'peanuts', 'peanut butter'],
    'tree nut': ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'hazelnut', 'macadamia'],
    shellfish: ['shrimp', 'crab', 'lobster', 'prawn', 'crawfish', 'crayfish'],
    fish: ['salmon', 'tuna', 'cod', 'fish sauce', 'anchovy', 'tilapia', 'halibut'],
    sesame: ['sesame', 'tahini'],
  };

  const detected = new Set<string>();

  for (const ingredient of ingredients) {
    const name = ingredient.name.toLowerCase();

    for (const [allergen, keywords] of Object.entries(allergenMap)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        detected.add(allergen);
      }
    }
  }

  return Array.from(detected);
}
