/**
 * Method step extraction and parsing
 */

import type { RecipeStep } from '@ultimate-social-chef/shared';
import { CULINARY_VERBS } from './ingredients.js';
import { extractTimes, extractTemperature } from './time.js';

/**
 * Extract method steps from text
 */
export function extractSteps(text: string): RecipeStep[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const steps: RecipeStep[] = [];

  let stepNumber = 1;

  for (const line of lines) {
    // Skip very short lines
    if (line.length < 10) continue;

    // Check if line starts with a culinary verb
    const firstWord = line.split(/\s+/)[0]?.toLowerCase();
    const startsWithVerb = CULINARY_VERBS.includes(firstWord);

    // Check if line starts with a number (e.g., "1. Mix ingredients")
    const startsWithNumber = /^\d+[\.\)]/.test(line);

    if (startsWithVerb || startsWithNumber) {
      // Extract timers
      const times = extractTimes(line);
      const timers = times.length > 0
        ? times.map(min => ({ min }))
        : undefined;

      // Extract temperature
      const tempC = extractTemperature(line) || undefined;

      // Clean up line (remove leading numbers)
      const cleanText = line.replace(/^\d+[\.\)]\s*/, '').trim();

      steps.push({
        n: stepNumber++,
        text: cleanText,
        timers,
        tempC,
      });
    }
  }

  return steps;
}

/**
 * Extract equipment from text
 */
export function extractEquipment(text: string): string[] {
  const equipmentKeywords = [
    'pan',
    'pot',
    'oven',
    'stove',
    'skillet',
    'wok',
    'grill',
    'air fryer',
    'instant pot',
    'slow cooker',
    'pressure cooker',
    'blender',
    'food processor',
    'mixer',
    'whisk',
    'spatula',
    'knife',
    'cutting board',
    'sheet pan',
    'baking sheet',
    'baking dish',
    'bowl',
    'measuring cup',
    'measuring spoon',
    'thermometer',
    'tongs',
    'ladle',
    'colander',
    'strainer',
    'peeler',
    'grater',
    'mortar and pestle',
    'rolling pin',
    'cast iron',
    'dutch oven',
    'saucepan',
    'stockpot',
    'roasting pan',
  ];

  const normalized = text.toLowerCase();
  const found = new Set<string>();

  for (const equipment of equipmentKeywords) {
    if (normalized.includes(equipment)) {
      found.add(equipment);
    }
  }

  return Array.from(found);
}

/**
 * Classify difficulty based on recipe complexity
 */
export function classifyDifficulty(
  ingredientCount: number,
  stepCount: number,
  techniques: string[]
): 'EASY' | 'MEDIUM' | 'HARD' {
  // Complex techniques
  const complexTechniques = [
    'braise',
    'confit',
    'deglaze',
    'emulsify',
    'ferment',
    'flambe',
    'julienne',
    'knead',
    'proof',
    'reduce',
    'temper',
    'truss',
  ];

  const hasComplexTechnique = techniques.some(t =>
    complexTechniques.some(ct => t.includes(ct))
  );

  // Scoring
  let complexity = 0;

  if (ingredientCount > 15) complexity += 2;
  else if (ingredientCount > 10) complexity += 1;

  if (stepCount > 10) complexity += 2;
  else if (stepCount > 6) complexity += 1;

  if (hasComplexTechnique) complexity += 2;

  if (complexity >= 4) return 'HARD';
  if (complexity >= 2) return 'MEDIUM';
  return 'EASY';
}
