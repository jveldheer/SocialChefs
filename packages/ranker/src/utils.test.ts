import { describe, it, expect } from 'vitest';
import {
  clamp,
  median,
  coefficientOfVariation,
  ema,
  jaccardSimilarity,
  generateShingles,
} from './utils';

describe('utils', () => {
  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('median', () => {
    it('should compute median for odd-length array', () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should compute median for even-length array', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it('should handle empty array', () => {
      expect(median([])).toBe(0);
    });
  });

  describe('coefficientOfVariation', () => {
    it('should compute CV', () => {
      const cv = coefficientOfVariation([2, 4, 6, 8]);
      expect(cv).toBeGreaterThan(0);
      expect(cv).toBeLessThan(1);
    });
  });

  describe('ema', () => {
    it('should compute exponential moving average', () => {
      const result = ema([1, 2, 3, 4, 5], 3);
      expect(result).toBeGreaterThan(3);
      expect(result).toBeLessThanOrEqual(5);
    });
  });

  describe('jaccardSimilarity', () => {
    it('should compute Jaccard similarity', () => {
      const setA = new Set(['a', 'b', 'c']);
      const setB = new Set(['b', 'c', 'd']);
      expect(jaccardSimilarity(setA, setB)).toBe(0.5); // 2 intersection / 4 union
    });

    it('should return 1 for identical sets', () => {
      const set = new Set(['a', 'b', 'c']);
      expect(jaccardSimilarity(set, set)).toBe(1);
    });

    it('should return 0 for disjoint sets', () => {
      const setA = new Set(['a', 'b']);
      const setB = new Set(['c', 'd']);
      expect(jaccardSimilarity(setA, setB)).toBe(0);
    });
  });

  describe('generateShingles', () => {
    it('should generate 3-grams', () => {
      const shingles = generateShingles('the quick brown fox', 3);
      expect(shingles.has('the quick brown')).toBe(true);
      expect(shingles.has('quick brown fox')).toBe(true);
    });

    it('should normalize text', () => {
      const shingles = generateShingles('The  Quick   Brown', 2);
      expect(shingles.has('the quick')).toBe(true);
    });
  });
});
