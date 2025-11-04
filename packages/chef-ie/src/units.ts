/**
 * Unit conversion and normalization for recipe ingredients
 */

export interface UnitConversion {
  unit: string;
  toGrams?: number; // For solids
  toMilliliters?: number; // For liquids
  aliases: string[];
}

// Unit conversion table
export const UNIT_MAP: Record<string, UnitConversion> = {
  // Volume - Metric
  ml: { unit: 'ml', toMilliliters: 1, aliases: ['ml', 'milliliter', 'milliliters'] },
  l: { unit: 'l', toMilliliters: 1000, aliases: ['l', 'liter', 'liters', 'litre', 'litres'] },

  // Volume - Imperial/US
  tsp: { unit: 'tsp', toMilliliters: 4.93, aliases: ['tsp', 'teaspoon', 'teaspoons'] },
  tbsp: { unit: 'tbsp', toMilliliters: 14.79, aliases: ['tbsp', 'tablespoon', 'tablespoons'] },
  cup: { unit: 'cup', toMilliliters: 240, aliases: ['cup', 'cups', 'c'] },
  pint: { unit: 'pint', toMilliliters: 473, aliases: ['pint', 'pints', 'pt'] },
  quart: { unit: 'quart', toMilliliters: 946, aliases: ['quart', 'quarts', 'qt'] },
  gallon: { unit: 'gallon', toMilliliters: 3785, aliases: ['gallon', 'gallons', 'gal'] },
  floz: { unit: 'fl oz', toMilliliters: 29.57, aliases: ['fl oz', 'floz', 'fluid ounce', 'fluid ounces'] },

  // Weight - Metric
  g: { unit: 'g', toGrams: 1, aliases: ['g', 'gram', 'grams'] },
  kg: { unit: 'kg', toGrams: 1000, aliases: ['kg', 'kilogram', 'kilograms'] },

  // Weight - Imperial/US
  oz: { unit: 'oz', toGrams: 28.35, aliases: ['oz', 'ounce', 'ounces'] },
  lb: { unit: 'lb', toGrams: 453.59, aliases: ['lb', 'lbs', 'pound', 'pounds'] },

  // Count/discrete
  piece: { unit: 'piece', aliases: ['piece', 'pieces', 'pc', 'pcs'] },
  whole: { unit: 'whole', aliases: ['whole'] },
  clove: { unit: 'clove', aliases: ['clove', 'cloves'] },
  can: { unit: 'can', aliases: ['can', 'cans'] },
  package: { unit: 'package', aliases: ['package', 'packages', 'pkg', 'pack'] },
  stick: { unit: 'stick', aliases: ['stick', 'sticks'] },
  leaf: { unit: 'leaf', aliases: ['leaf', 'leaves'] },
  slice: { unit: 'slice', aliases: ['slice', 'slices'] },
  bunch: { unit: 'bunch', aliases: ['bunch', 'bunches'] },
  head: { unit: 'head', aliases: ['head', 'heads'] },
  sprig: { unit: 'sprig', aliases: ['sprig', 'sprigs'] },

  // Special
  pinch: { unit: 'pinch', aliases: ['pinch', 'pinches'] },
  dash: { unit: 'dash', aliases: ['dash', 'dashes'] },
  handful: { unit: 'handful', aliases: ['handful', 'handfuls'] },
  taste: { unit: 'to taste', aliases: ['to taste', 'taste'] },
};

/**
 * Normalize unit string to canonical form
 */
export function normalizeUnit(unit: string): string | null {
  const normalized = unit.toLowerCase().trim();

  for (const info of Object.values(UNIT_MAP)) {
    if (info.aliases.includes(normalized)) {
      return info.unit;
    }
  }

  return null;
}

/**
 * Convert quantity and unit to grams (for solids) or milliliters (for liquids)
 */
export function convertToMetric(
  quantity: number,
  unit: string
): { grams?: number; milliliters?: number } | null {
  const canonicalUnit = normalizeUnit(unit);
  if (!canonicalUnit) return null;

  const unitInfo = Object.values(UNIT_MAP).find(u => u.unit === canonicalUnit);
  if (!unitInfo) return null;

  const result: { grams?: number; milliliters?: number } = {};

  if (unitInfo.toGrams) {
    result.grams = quantity * unitInfo.toGrams;
  }

  if (unitInfo.toMilliliters) {
    result.milliliters = quantity * unitInfo.toMilliliters;
  }

  return result;
}

/**
 * Parse quantity from string (handles fractions like "1/2", "1 1/2")
 */
export function parseQuantity(text: string): number | null {
  const cleaned = text.trim();

  // Handle fractions like "1/2"
  const fractionMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const [, num, den] = fractionMatch;
    return parseInt(num) / parseInt(den);
  }

  // Handle mixed numbers like "1 1/2"
  const mixedMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const [, whole, num, den] = mixedMatch;
    return parseInt(whole) + parseInt(num) / parseInt(den);
  }

  // Handle decimal numbers
  const decimal = parseFloat(cleaned);
  return isNaN(decimal) ? null : decimal;
}
