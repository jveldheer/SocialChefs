/**
 * Statistical utility functions for ranking algorithms
 */

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute median of an array
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Compute Median Absolute Deviation (MAD)
 */
export function mad(values: number[]): number {
  if (values.length === 0) return 0;
  const med = median(values);
  const deviations = values.map(v => Math.abs(v - med));
  return median(deviations);
}

/**
 * Compute robust Z-score using median and MAD
 * More resistant to outliers than standard Z-score
 */
export function robustZScore(value: number, values: number[]): number {
  const med = median(values);
  const madValue = mad(values);
  if (madValue === 0) return 0;
  return (value - med) / (1.4826 * madValue); // 1.4826 makes MAD consistent with SD for normal distribution
}

/**
 * Normalize array to [0, 1] using min-max scaling
 */
export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map(v => (v - min) / (max - min));
}

/**
 * Compute coefficient of variation (CV) of inter-event intervals
 * Used for consistency scoring
 */
export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return stdDev / mean;
}

/**
 * Exponential Moving Average (EMA)
 * @param values Time series values (oldest to newest)
 * @param span Number of periods for the span
 */
export function ema(values: number[], span: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const alpha = 2 / (span + 1);
  let emaValue = values[0];

  for (let i = 1; i < values.length; i++) {
    emaValue = alpha * values[i] + (1 - alpha) * emaValue;
  }

  return emaValue;
}

/**
 * Compute Jaccard similarity between two sets
 */
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Simple MinHash for locality-sensitive hashing
 * @param shingles Set of n-grams/shingles
 * @param numHashes Number of hash functions
 */
export function minHash(shingles: Set<string>, numHashes: number = 100): number[] {
  const signatures: number[] = [];
  const shingleArray = Array.from(shingles);

  for (let i = 0; i < numHashes; i++) {
    let minHashValue = Infinity;
    for (const shingle of shingleArray) {
      // Simple hash function (not cryptographic, just for LSH)
      const hash = simpleHash(shingle, i);
      if (hash < minHashValue) {
        minHashValue = hash;
      }
    }
    signatures.push(minHashValue);
  }

  return signatures;
}

/**
 * Simple hash function for MinHash
 */
function simpleHash(str: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Compute MinHash signature similarity (estimate of Jaccard)
 */
export function minHashSimilarity(sig1: number[], sig2: number[]): number {
  if (sig1.length !== sig2.length) return 0;
  let matches = 0;
  for (let i = 0; i < sig1.length; i++) {
    if (sig1[i] === sig2[i]) matches++;
  }
  return matches / sig1.length;
}

/**
 * Generate n-grams (shingles) from text
 */
export function generateShingles(text: string, n: number = 3): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const words = normalized.split(' ');
  const shingles = new Set<string>();

  for (let i = 0; i <= words.length - n; i++) {
    const shingle = words.slice(i, i + n).join(' ');
    shingles.add(shingle);
  }

  return shingles;
}

/**
 * Detect outliers using interquartile range method
 * Returns true if value is an outlier
 */
export function isOutlier(value: number, values: number[]): boolean {
  if (values.length < 4) return false;

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return value < lowerBound || value > upperBound;
}

/**
 * Logistic decay function for recency boost
 * @param daysSince Days since the event
 * @param midpoint Midpoint of decay (50% value)
 * @param steepness Controls how steep the decay is
 */
export function logisticDecay(daysSince: number, midpoint: number = 60, steepness: number = 0.1): number {
  return 1 / (1 + Math.exp(steepness * (daysSince - midpoint)));
}
