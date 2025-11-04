/**
 * Time extraction from recipe text
 */

/**
 * Extract time durations from text
 * Returns array of minutes
 */
export function extractTimes(text: string): number[] {
  const times: number[] = [];

  // Pattern: "10 minutes", "2 hours", "30 mins", "1.5 hours"
  const timePattern = /(\d+(?:\.\d+)?)\s*(minute|min|minutes|mins|hour|hours|hr|hrs|second|seconds|sec|secs)/gi;

  let match;
  while ((match = timePattern.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    let minutes = value;
    if (unit.startsWith('hour') || unit.startsWith('hr')) {
      minutes = value * 60;
    } else if (unit.startsWith('second') || unit.startsWith('sec')) {
      minutes = value / 60;
    }

    times.push(Math.round(minutes));
  }

  return times;
}

/**
 * Extract temperature from text
 * Returns temperature in Celsius
 */
export function extractTemperature(text: string): number | null {
  // Pattern: "350°F", "180°C", "350 degrees", "350F", "180C"
  const tempPattern = /(\d+)\s*°?\s*(f|fahrenheit|c|celsius|degrees?\s*(f|fahrenheit|c|celsius)?)/gi;

  const match = tempPattern.exec(text);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  // Convert to Celsius
  if (unit.startsWith('f') || unit.includes('fahrenheit')) {
    return Math.round((value - 32) * (5 / 9));
  }

  return value; // Already Celsius
}

/**
 * Estimate time from verb complexity and ingredient count
 * Returns estimated minutes
 */
export function estimateTimeFromComplexity(
  stepCount: number,
  ingredientCount: number,
  techniques: string[]
): number {
  // Base time per step: 5 minutes
  let totalMin = stepCount * 5;

  // Add time based on ingredient count (prep time)
  totalMin += ingredientCount * 2;

  // Add time for complex techniques
  const timeAddingTechniques = [
    'bake',
    'roast',
    'simmer',
    'braise',
    'marinate',
    'ferment',
    'proof',
    'rest',
    'chill',
    'freeze',
  ];

  for (const technique of techniques) {
    if (timeAddingTechniques.some(t => technique.includes(t))) {
      totalMin += 20; // Add extra time for slow techniques
    }
  }

  return Math.max(10, Math.min(120, totalMin)); // Clamp between 10-120 minutes
}
